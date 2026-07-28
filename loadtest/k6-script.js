// k6 load test — ElimuNova API
// Run: k6 run loadtest/k6-script.js
import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate } from 'k6/metrics'

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000/api'
const FAIL_RATE = new Rate('failed_requests')

export const options = {
  stages: [
    { duration: '30s', target: 10 },  // Ramp up to 10 users
    { duration: '1m',  target: 50 },  // Ramp to 50 users
    { duration: '30s', target: 100 }, // Peak 100 users
    { duration: '1m',  target: 100 }, // Hold
    { duration: '30s', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests under 2s
    failed_requests: ['rate<0.05'],    // Less than 5% failure
  },
}

export default function () {
  // Health check (unauthenticated)
  const health = http.get(`${BASE_URL}/health`)
  check(health, { 'health status 200': (r) => r.status === 200 })
  FAIL_RATE.add(health.status >= 400)
  sleep(1)

  // Teacher list students (will be 401 without auth — testing rate limiting)
  const students = http.get(`${BASE_URL}/teacher/students`, {
    headers: { 'Content-Type': 'application/json' },
  })
  // 401 is expected (no auth token) — just ensure it doesn't crash
  check(students, { 'students returns (auth or 401)': (r) => r.status < 500 })
  FAIL_RATE.add(students.status >= 500)
  sleep(0.5)

  // Class list
  const classes = http.get(`${BASE_URL}/teacher/classes`, {
    headers: { 'Content-Type': 'application/json' },
  })
  check(classes, { 'classes returns (auth or 401)': (r) => r.status < 500 })
  FAIL_RATE.add(classes.status >= 500)
  sleep(0.5)

  // API docs (unauthenticated)
  const docs = http.get(`${BASE_URL}/docs`)
  check(docs, { 'docs status 200': (r) => r.status === 200 })
  FAIL_RATE.add(docs.status >= 400)
  sleep(1)
}
