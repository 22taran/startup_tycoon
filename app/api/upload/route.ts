import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth.config'
import { uploadRateLimit } from '@/lib/rate-limit'

// File signature validation function
function validateFileSignature(buffer: Buffer, extension: string): boolean {
  const signatures: Record<string, number[][]> = {
    '.pdf': [[0x25, 0x50, 0x44, 0x46]], // %PDF
    '.doc': [[0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1]], // Microsoft Office
    '.docx': [[0x50, 0x4B, 0x03, 0x04]], // ZIP-based (DOCX is a ZIP file)
    '.txt': [], // Text files don't have specific signatures
    '.md': [] // Markdown files don't have specific signatures
  }
  
  const signature = signatures[extension]
  if (!signature || signature.length === 0) {
    return true // No signature to check
  }
  
  return signature.some(sig => 
    sig.every((byte, index) => buffer[index] === byte)
  )
}

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = uploadRateLimit(request)
    if (!rateLimitResult.success) {
      return rateLimitResult.response
    }

    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const folder = formData.get('folder') as string || 'uploads'

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type and extension
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/markdown'
    ]
    
    const allowedExtensions = ['.pdf', '.doc', '.docx', '.txt', '.md']
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
    
    if (!allowedTypes.includes(file.type) || !allowedExtensions.includes(fileExtension)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Only PDF, DOC, DOCX, TXT, and MD files are allowed.' },
        { status: 400 }
      )
    }
    
    // Additional security: Check file signature (magic bytes)
    const buffer = Buffer.from(await file.arrayBuffer())
    const isValidFile = validateFileSignature(buffer, fileExtension)
    
    if (!isValidFile) {
      return NextResponse.json(
        { success: false, error: 'File content does not match file extension.' },
        { status: 400 }
      )
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      )
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', folder)
    await mkdir(uploadsDir, { recursive: true })

    // Generate unique filename
    const timestamp = Date.now()
    const fileExt = file.name.split('.').pop()
    const fileName = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    const filePath = join(uploadsDir, fileName)

    // Write file to disk (buffer already created during validation)
    await writeFile(filePath, buffer)

    // Return public URL
    const publicUrl = `/uploads/${folder}/${fileName}`

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName: file.name,
      size: file.size
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}
