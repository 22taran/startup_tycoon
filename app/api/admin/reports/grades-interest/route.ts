import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth.config'
import { getSimpleSupabaseClient } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    
    if (session.user.role !== 'admin' && session.user.role !== 'instructor') {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 403 })
    }
    
    const supabase = getSimpleSupabaseClient()
    
    // Get all assignments
    const { data: assignments, error: assignmentsError } = await supabase
      .from('assignments')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (assignmentsError) throw assignmentsError
    
    // Get all users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, email, role')
      .order('name')
    
    if (usersError) throw usersError
    
    const usersMap = (users || []).reduce((acc, user) => {
      acc[user.id] = user
      return acc
    }, {})
    
    // Get all grades
    const { data: grades, error: gradesError } = await supabase
      .from('grades')
      .select(`
        *,
        teams!inner(id, name, members),
        assignments!inner(id, title, course_id)
      `)
      .order('created_at', { ascending: false })
    
    if (gradesError) throw gradesError
    
    // Get all interest records
    const { data: interestRecords, error: interestError } = await supabase
      .from('student_interest_tracking')
      .select(`
        *,
        teams!inner(id, name),
        assignments!inner(id, title)
      `)
      .order('created_at', { ascending: false })
    
    if (interestError) throw interestError
    
    // Get all investments
    const { data: investments, error: investmentsError } = await supabase
      .from('assignment_investments')
      .select(`
        *,
        teams!inner(id, name),
        assignments!inner(id, title)
      `)
      .order('created_at', { ascending: false })
    
    if (investmentsError) throw investmentsError
    
    // Process data for report
    const reportData = {
      summary: {
        assignments: assignments?.length || 0,
        grades: grades?.length || 0,
        interestRecords: interestRecords?.length || 0,
        investments: investments?.length || 0,
        users: users?.length || 0,
        totalInterest: interestRecords?.reduce((sum, record) => sum + (record.interest_earned || 0), 0) || 0,
        totalInvestments: investments?.reduce((sum, inv) => sum + (inv.tokens_invested || 0), 0) || 0,
        averageGrade: grades?.reduce((sum, grade) => sum + (grade.percentage || 0), 0) / (grades?.length || 1) || 0
      },
      assignments: (assignments || []).map(assignment => {
        const assignmentGrades = grades?.filter(g => g.assignment_id === assignment.id) || []
        const assignmentInterest = interestRecords?.filter(i => i.assignment_id === assignment.id) || []
        const assignmentInvestments = investments?.filter(i => i.assignment_id === assignment.id) || []
        
        // Group interest by student
        const interestByStudent = assignmentInterest.reduce((acc, record) => {
          if (!acc[record.student_id]) {
            acc[record.student_id] = {
              student: usersMap[record.student_id] || { name: 'Unknown', email: 'Unknown' },
              records: [],
              totalInterest: 0
            }
          }
          acc[record.student_id].records.push(record)
          acc[record.student_id].totalInterest += record.interest_earned || 0
          return acc
        }, {})
        
        return {
          id: assignment.id,
          title: assignment.title,
          courseId: assignment.course_id,
          dueDate: assignment.dueDate,
          status: assignment.status,
          isEvaluationActive: assignment.isEvaluationActive,
          grades: assignmentGrades.map(grade => ({
            id: grade.id,
            teamId: grade.team_id,
            teamName: grade.teams?.name || 'Unknown',
            teamMembers: grade.teams?.members?.map(memberId => usersMap[memberId]?.name || 'Unknown').join(', ') || 'No members',
            score: grade.percentage || 0,
            averageInvestment: grade.average_investment || 0,
            totalInvestments: grade.total_investments || 0,
            performanceTier: grade.grade || 'Unknown',
            createdAt: grade.created_at
          })),
          interestDistribution: Object.values(interestByStudent).map(studentData => ({
            studentId: studentData.student.id,
            studentName: studentData.student.name,
            studentEmail: studentData.student.email,
            totalInterest: studentData.totalInterest,
            bonusPotential: Math.min(studentData.totalInterest / 100, 0.20) * 100,
            investments: studentData.records.map(record => ({
              teamId: record.invested_team_id,
              teamName: record.teams?.name || 'Unknown',
              tokensInvested: record.tokens_invested,
              interestEarned: record.interest_earned,
              performanceTier: record.team_performance_tier
            }))
          })),
          investmentSummary: {
            totalTokensInvested: assignmentInvestments.reduce((sum, inv) => sum + (inv.tokens_invested || 0), 0),
            averageInvestment: assignmentInvestments.length > 0 ? assignmentInvestments.reduce((sum, inv) => sum + (inv.tokens_invested || 0), 0) / assignmentInvestments.length : 0,
            numberOfInvestments: assignmentInvestments.length
          }
        }
      }),
      topPerformers: (() => {
        const allStudentInterest = {}
        for (const assignment of assignments || []) {
          const assignmentInterest = interestRecords?.filter(i => i.assignment_id === assignment.id) || []
          assignmentInterest.forEach(record => {
            if (!allStudentInterest[record.student_id]) {
              allStudentInterest[record.student_id] = {
                student: usersMap[record.student_id] || { name: 'Unknown', email: 'Unknown' },
                totalInterest: 0
              }
            }
            allStudentInterest[record.student_id].totalInterest += record.interest_earned || 0
          })
        }
        return Object.values(allStudentInterest)
          .sort((a, b) => b.totalInterest - a.totalInterest)
          .slice(0, 10)
      })()
    }
    
    // Generate HTML report
    const htmlReport = generateHTMLReport(reportData)
    
    return new NextResponse(htmlReport, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': 'attachment; filename="grades-interest-report.html"'
      }
    })
    
  } catch (error) {
    console.error('Error generating report:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate report' },
      { status: 500 }
    )
  }
}

function generateHTMLReport(data: any): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Grades & Interest Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .header { text-align: center; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .summary-card { border: 1px solid #ddd; padding: 15px; border-radius: 8px; background: #f9f9f9; }
        .assignment { margin-bottom: 40px; border: 1px solid #ddd; padding: 20px; border-radius: 8px; }
        .grades-table, .interest-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        .grades-table th, .grades-table td, .interest-table th, .interest-table td { 
            border: 1px solid #ddd; padding: 8px; text-align: left; 
        }
        .grades-table th, .interest-table th { background-color: #f2f2f2; }
        .high-tier { color: #22c55e; font-weight: bold; }
        .median-tier { color: #f59e0b; font-weight: bold; }
        .low-tier { color: #ef4444; font-weight: bold; }
        .top-performers { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; }
        .performer-card { border: 1px solid #ddd; padding: 15px; border-radius: 8px; background: #f9f9f9; }
    </style>
</head>
<body>
    <div class="header">
        <h1>📊 Grades & Interest Report</h1>
        <p>Generated on ${new Date().toLocaleString()}</p>
    </div>
    
    <div class="summary">
        <div class="summary-card">
            <h3>📚 Assignments</h3>
            <p><strong>${data.summary.assignments}</strong></p>
        </div>
        <div class="summary-card">
            <h3>📊 Grades</h3>
            <p><strong>${data.summary.grades}</strong></p>
        </div>
        <div class="summary-card">
            <h3>💰 Interest Records</h3>
            <p><strong>${data.summary.interestRecords}</strong></p>
        </div>
        <div class="summary-card">
            <h3>💸 Investments</h3>
            <p><strong>${data.summary.investments}</strong></p>
        </div>
        <div class="summary-card">
            <h3>👥 Users</h3>
            <p><strong>${data.summary.users}</strong></p>
        </div>
        <div class="summary-card">
            <h3>💰 Total Interest</h3>
            <p><strong>${data.summary.totalInterest.toFixed(2)}</strong></p>
        </div>
        <div class="summary-card">
            <h3>💸 Total Investments</h3>
            <p><strong>${data.summary.totalInvestments} tokens</strong></p>
        </div>
        <div class="summary-card">
            <h3>📊 Average Grade</h3>
            <p><strong>${data.summary.averageGrade.toFixed(1)}%</strong></p>
        </div>
    </div>
    
    ${data.assignments.map(assignment => `
        <div class="assignment">
            <h2>📚 ${assignment.title}</h2>
            <p><strong>ID:</strong> ${assignment.id}</p>
            <p><strong>Course:</strong> ${assignment.courseId}</p>
            <p><strong>Due Date:</strong> ${assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : 'TBD'}</p>
            <p><strong>Status:</strong> ${assignment.status || 'Unknown'}</p>
            <p><strong>Evaluation Active:</strong> ${assignment.isEvaluationActive ? 'Yes' : 'No'}</p>
            
            <h3>📊 Grades (${assignment.grades.length} teams)</h3>
            ${assignment.grades.length > 0 ? `
                <table class="grades-table">
                    <thead>
                        <tr>
                            <th>Team</th>
                            <th>Members</th>
                            <th>Score</th>
                            <th>Avg Investment</th>
                            <th>Total Investments</th>
                            <th>Performance Tier</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${assignment.grades.map(grade => `
                            <tr>
                                <td>${grade.teamName}</td>
                                <td>${grade.teamMembers}</td>
                                <td>${grade.score}%</td>
                                <td>${grade.averageInvestment} tokens</td>
                                <td>${grade.totalInvestments}</td>
                                <td class="${grade.performanceTier === 'high' ? 'high-tier' : grade.performanceTier === 'median' ? 'median-tier' : 'low-tier'}">${grade.performanceTier}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            ` : '<p>No grades found for this assignment</p>'}
            
            <h3>💰 Interest Distribution (${assignment.interestDistribution.length} students)</h3>
            ${assignment.interestDistribution.length > 0 ? `
                <table class="interest-table">
                    <thead>
                        <tr>
                            <th>Student</th>
                            <th>Email</th>
                            <th>Total Interest</th>
                            <th>Bonus Potential</th>
                            <th>Investments</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${assignment.interestDistribution.map(student => `
                            <tr>
                                <td>${student.studentName}</td>
                                <td>${student.studentEmail}</td>
                                <td>${student.totalInterest.toFixed(2)}</td>
                                <td>${student.bonusPotential.toFixed(1)}%</td>
                                <td>
                                    ${student.investments.map(inv => `
                                        Team ${inv.teamName}: ${inv.tokensInvested} tokens → ${inv.interestEarned} interest (${inv.performanceTier} tier)
                                    `).join('<br>')}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            ` : '<p>No interest records found for this assignment</p>'}
            
            <h3>💸 Investment Summary</h3>
            <p><strong>Total Tokens Invested:</strong> ${assignment.investmentSummary.totalTokensInvested}</p>
            <p><strong>Average Investment:</strong> ${assignment.investmentSummary.averageInvestment.toFixed(2)} tokens</p>
            <p><strong>Number of Investments:</strong> ${assignment.investmentSummary.numberOfInvestments}</p>
        </div>
    `).join('')}
    
    <h2>🏆 Top Interest Earners</h2>
    <div class="top-performers">
        ${data.topPerformers.map((performer, index) => `
            <div class="performer-card">
                <h4>#${index + 1} ${performer.student.name}</h4>
                <p><strong>Email:</strong> ${performer.student.email}</p>
                <p><strong>Total Interest:</strong> ${performer.totalInterest.toFixed(2)}</p>
                <p><strong>Bonus Potential:</strong> ${Math.min(performer.totalInterest / 100, 0.20) * 100}%</p>
            </div>
        `).join('')}
    </div>
    
    <h2>📊 How Grades Are Calculated</h2>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0;">
        <div>
            <h3>Grading Process:</h3>
            <ol>
                <li>Students invest tokens in up to 3 teams</li>
                <li>Each team receives investments from 5 evaluators</li>
                <li>Highest and lowest investments are dropped</li>
                <li>Remaining investments are averaged</li>
                <li>Teams are ranked and assigned tiers</li>
                <li>Grades: High (100%), Median (80%), Low (60%)</li>
            </ol>
        </div>
        <div>
            <h3>Interest Calculation:</h3>
            <ol>
                <li>Based on team performance tier</li>
                <li>High tier: 20% interest rate</li>
                <li>Median tier: 10% interest rate</li>
                <li>Low tier: 5% interest rate</li>
                <li>Incomplete: 0% interest</li>
                <li>Maximum 20% bonus to final grade</li>
            </ol>
        </div>
    </div>
</body>
</html>
  `
}
