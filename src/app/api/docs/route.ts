// ──────────────────────────────────────────────────────────────
// OpenAPI 3.1 documentation endpoint — self-documents all
// public and authenticated API endpoints.
// Visit GET /api/docs to explore the full API surface.
// ──────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server'

const apiDocs = {
  openapi: '3.1.0',
  info: {
    title: 'ElimuNova API',
    version: '1.0.0',
    description: 'REST API for ElimuNova — CBC curriculum management, lesson planning, and student tracking.',
  },
  servers: [
    { url: '/api', description: 'API base path' },
  ],
  paths: {
    '/health': {
      get: {
        summary: 'Health check',
        tags: ['System'],
        responses: { '200': { description: 'Service healthy' } },
      },
    },
    '/teacher/students': {
      get: {
        summary: 'List students',
        tags: ['Teacher'],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'pageSize', in: 'query', schema: { type: 'integer', default: 50 } },
        ],
        responses: { '200': { description: 'Paginated student list' } },
      },
      post: {
        summary: 'Create student',
        tags: ['Teacher'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['firstName', 'lastName'],
                properties: {
                  firstName: { type: 'string', description: 'Student first name' },
                  lastName: { type: 'string', description: 'Student last name' },
                  email: { type: 'string', format: 'email', description: 'Login email (auto-generated if empty)' },
                  phone: { type: 'string', description: 'Phone number' },
                  address: { type: 'string', description: 'Physical address' },
                  classId: { type: 'string', description: 'Class ID to assign' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Student created with credentials' },
          '400': { description: 'Validation error' },
        },
      },
    },
    '/teacher/classes': {
      get: {
        summary: 'List classes',
        tags: ['Teacher'],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'pageSize', in: 'query', schema: { type: 'integer', default: 50 } },
        ],
        responses: { '200': { description: 'Paginated class list' } },
      },
      post: {
        summary: 'Create class',
        tags: ['Teacher'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'grade', 'subject'],
                properties: {
                  name: { type: 'string', description: 'Class name (e.g., Grade 8A)' },
                  grade: { type: 'string', description: 'Grade level' },
                  subject: { type: 'string', description: 'Subject' },
                  description: { type: 'string', description: 'Optional description' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Class created' },
          '409': { description: 'Duplicate class name' },
        },
      },
    },
    '/teacher/students/{id}': {
      get: {
        summary: 'Get student details',
        tags: ['Teacher'],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Student details' } },
      },
      delete: {
        summary: 'Soft-delete student',
        tags: ['Teacher'],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Student soft-deleted' } },
      },
    },
    '/teacher/marks': {
      post: {
        summary: 'Grade submissions',
        tags: ['Teacher'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['assignmentId', 'marks'],
                properties: {
                  assignmentId: { type: 'string' },
                  marks: { type: 'array', items: { type: 'object' } },
                  gradeSystem: { type: 'string', enum: ['percentage', 'cbc_lower', 'cbc_upper'] },
                  analyseWithAI: { type: 'boolean' },
                },
              },
            },
          },
        },
        responses: { '200': { description: 'Grades saved' } },
      },
    },
    '/parent/meetings': {
      get: {
        summary: 'List meetings (parent)',
        tags: ['Parent'],
        parameters: [{ name: 'includePast', in: 'query', schema: { type: 'boolean' } }],
        responses: { '200': { description: 'Meeting list' } },
      },
      post: {
        summary: 'Create meeting (parent)',
        tags: ['Parent'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title', 'date', 'time'],
                properties: {
                  title: { type: 'string' },
                  date: { type: 'string', format: 'date' },
                  time: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { '201': { description: 'Meeting created' } },
      },
    },
  },
  components: {
    schemas: {
      Pagination: {
        type: 'object',
        properties: {
          page: { type: 'integer' },
          pageSize: { type: 'integer' },
          total: { type: 'integer' },
          totalPages: { type: 'integer' },
        },
      },
      ApiError: {
        type: 'object',
        properties: {
          error: { type: 'string' },
          code: { type: 'string' },
        },
      },
    },
  },
}

export async function GET() {
  return NextResponse.json(apiDocs)
}
