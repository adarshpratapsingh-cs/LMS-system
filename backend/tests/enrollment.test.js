const request = require('supertest');
const jwt = require('jsonwebtoken');

const app = require('../src/app');
const { prisma } = require('../src/config/db');

describe('Enrollment API', () => {
  let student;
  let instructor;
  let course;
  let token;

  // Create test data before running tests
  beforeAll(async () => {
    try {
      // Create student
      student = await prisma.user.create({
        data: {
          name: 'Test Student',
          email: `student-${Date.now()}@example.com`,
          password: 'testpassword',
          role: 'user',
          status: 'approved',
        },
      });

      // Create instructor
      instructor = await prisma.user.create({
        data: {
          name: 'Test Instructor',
          email: `instructor-${Date.now()}@example.com`,
          password: 'testpassword',
          role: 'instructor',
          status: 'approved',
        },
      });

      // Create approved course
      course = await prisma.course.create({
        data: {
          title: 'Test Enrollment Course',
          description: 'Course created for enrollment testing',
          category: 'Testing',
          instructorId: instructor.id,
          outcomes: [],
          status: 'approved',
        },
      });

      // Create JWT token for student
      token = jwt.sign(
        { id: student.id },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
    } catch (error) {
      console.log('========== PRISMA ERROR ==========');
      console.log('CODE:', error.code);
      console.log('META:', error.meta);
      console.log('MESSAGE:', error.message);
      console.log('==================================');

      throw error;
    }
  });

  // Delete test data after all tests
  afterAll(async () => {
    if (student) {
      await prisma.enrollment.deleteMany({
        where: {
          userId: student.id,
        },
      });
    }

    if (course) {
      await prisma.course.delete({
        where: {
          id: course.id,
        },
      });
    }

    if (student) {
      await prisma.user.delete({
        where: {
          id: student.id,
        },
      });
    }

    if (instructor) {
      await prisma.user.delete({
        where: {
          id: instructor.id,
        },
      });
    }

    await prisma.$disconnect();
  });

  // 1. Authentication check
  test('should reject request without authentication', async () => {
    const response = await request(app)
      .post(`/api/v1/enrollments/${course.id}`);

    expect(response.statusCode).toBe(401);
  });

  // 2. Successful enrollment
  test('should enroll authenticated user in approved course', async () => {
    const response = await request(app)
      .post(`/api/v1/enrollments/${course.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(201);
    expect(response.body.success).toBe(true);

    expect(response.body.data.userId).toBe(student.id);
    expect(response.body.data.courseId).toBe(course.id);

    // Enrollment status should be active by default
    expect(response.body.data.status).toBe('active');

    // Enrollment timestamp should be generated
    expect(response.body.data.createdAt).toBeDefined();
  });

  // 3. Duplicate enrollment check
  test('should prevent duplicate enrollment', async () => {
    const response = await request(app)
      .post(`/api/v1/enrollments/${course.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe('Already enrolled in this course');
  });

  // 4. Course existence check
  test('should return 404 when course does not exist', async () => {
    const response = await request(app)
      .post('/api/v1/enrollments/non-existent-course-id')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe('Course not found');
  });

  // 5. Active course check
  test('should reject enrollment in inactive course', async () => {
    const inactiveCourse = await prisma.course.create({
      data: {
        title: 'Inactive Test Course',
        description: 'Course created for inactive course testing',
        category: 'Testing',
        instructorId: instructor.id,
        outcomes: [],
        status: 'pending',
      },
    });

    try {
      const response = await request(app)
        .post(`/api/v1/enrollments/${inactiveCourse.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Course is not active');
    } finally {
      // Clean up inactive course
      await prisma.course.delete({
        where: {
          id: inactiveCourse.id,
        },
      });
    }
  });
});