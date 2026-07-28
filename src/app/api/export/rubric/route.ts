import { NextResponse } from 'next/server';
import { route } from '@/lib/api-middleware';

export const POST = route({}, async (req, { user }) => {
  const { rubric, format = 'pdf' } = await req.json();

  if (!rubric || !rubric.title || !rubric.criteria || !rubric.performanceLevels) {
    return NextResponse.json({ error: 'Invalid rubric data' }, { status: 400 });
  }

  if (format === 'pdf') {
    return await generatePDF(rubric);
  } else if (format === 'word') {
    return await generateWord(rubric);
  } else {
    return NextResponse.json({ error: 'Unsupported format' }, { status: 400 });
  }
});

async function generatePDF(rubric: any) {
  try {
    const html = generateRubricHTML(rubric);

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="${rubric.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_rubric.html"`
      }
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}

async function generateWord(rubric: any) {
  try {
    const html = generateRubricHTML(rubric);

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'application/msword',
        'Content-Disposition': `attachment; filename="${rubric.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_rubric.doc"`
      }
    });
  } catch (error) {
    console.error('Error generating Word document:', error);
    throw error;
  }
}

function generateRubricHTML(rubric: any) {
  const calculatedPoints = rubric.criteria.reduce((total: number, criterion: any) => {
    return total + (criterion.maxScore * criterion.weight);
  }, 0);
  const totalPoints = rubric.totalPoints || calculatedPoints;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${rubric.title} - Rubric</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background-color: #fff;
        }
        .header {
            text-align: center;
            border-bottom: 3px solid #3b82f6;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #1e40af;
            margin: 0;
            font-size: 2.5em;
        }
        .header .subtitle {
            color: #6b7280;
            font-size: 1.2em;
            margin: 10px 0;
        }
        .header .description {
            color: #4b5563;
            font-style: italic;
            margin-top: 10px;
        }
        .rubric-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .rubric-table th {
            background-color: #3b82f6;
            color: white;
            padding: 15px;
            text-align: left;
            font-weight: bold;
            border: 1px solid #2563eb;
        }
        .rubric-table th.performance-level {
            text-align: center;
            min-width: 150px;
        }
        .rubric-table td {
            padding: 15px;
            border: 1px solid #d1d5db;
            vertical-align: top;
        }
        .rubric-table tr:nth-child(even) {
            background-color: #f9fafb;
        }
        .rubric-table tr:hover {
            background-color: #f3f4f6;
        }
        .criterion-title {
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 5px;
        }
        .criterion-description {
            color: #6b7280;
            font-size: 0.9em;
            margin-bottom: 5px;
        }
        .criterion-weight {
            color: #9ca3af;
            font-size: 0.8em;
            font-style: italic;
        }
        .performance-level-name {
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 5px;
        }
        .performance-level-score {
            color: #6b7280;
            font-size: 0.9em;
            margin-bottom: 5px;
        }
        .performance-level-description {
            color: #4b5563;
            font-size: 0.9em;
        }
        .total-points {
            text-align: right;
            font-size: 1.2em;
            font-weight: bold;
            color: #1e40af;
            margin-top: 20px;
            padding: 15px;
            background-color: #eff6ff;
            border-radius: 8px;
        }
        .footer {
            margin-top: 40px;
            text-align: center;
            color: #9ca3af;
            font-size: 0.9em;
            border-top: 1px solid #e5e7eb;
            padding-top: 20px;
        }
        @media print {
            body {
                margin: 0;
                padding: 15px;
            }
            .rubric-table {
                page-break-inside: avoid;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>${rubric.title}</h1>
        <div class="subtitle">${rubric.subject} • ${rubric.grade}</div>
        ${rubric.description ? `<div class="description">${rubric.description}</div>` : ''}
    </div>

    <table class="rubric-table">
        <thead>
            <tr>
                <th style="width: 30%;">Criteria</th>
                ${rubric.performanceLevels.map((level: any) =>
                    `<th class="performance-level">
                        <div class="performance-level-name">${level.name}</div>
                        <div class="performance-level-score">(${level.score} points)</div>
                    </th>`
                ).join('')}
            </tr>
        </thead>
        <tbody>
            ${rubric.criteria.map((criterion: any) => `
                <tr>
                    <td>
                        <div class="criterion-title">${criterion.title}</div>
                        <div class="criterion-description">${criterion.description}</div>
                        <div class="criterion-weight">Weight: ${criterion.weight}</div>
                    </td>
                    ${rubric.performanceLevels.map((level: any) =>
                        `<td>
                            <div class="performance-level-description">${level.description}</div>
                        </td>`
                    ).join('')}
                </tr>
            `).join('')}
        </tbody>
    </table>

    <div class="total-points">
        Total Points: ${totalPoints}
        ${calculatedPoints !== totalPoints ? `<br><span style="font-size: 0.8em; color: #6b7280;">(Calculated: ${calculatedPoints} points)</span>` : ''}
    </div>

    <div class="footer">
        <p>Generated by ElimuNova AI • ${new Date().toLocaleDateString()}</p>
    </div>
</body>
</html>
  `;
}
