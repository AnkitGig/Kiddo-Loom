# School Management API - Parent Module

A comprehensive Node.js API for school management system focusing on parent functionality. Parents can search schools, apply for admissions, and manage their profiles and children's information.

## Features

### Authentication
- Super admin creates parent and teacher accounts
- First-time login with temporary password
- Mandatory password change on first login
- JWT-based authentication
- Password reset functionality
- Account status management

### Admin Management
- Create parent and teacher accounts
- Manage user status (active, inactive, suspended)
- Reset user passwords
- Delete user accounts
- User statistics and analytics
- Search and filter users

### School Management
- Search schools by name, location, fees
- Filter schools by various criteria
- Get detailed school information
- Location-based school search

### Parent Profile
- Complete parent profile management
- Add/update/delete children information
- Emergency contact management
- Notification preferences

### School Applications
- Submit school applications
- Track application status
- Update pending applications
- Cancel applications

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **Environment**: dotenv

## Project Structure

\`\`\`
school-management-api/
├── config/
│   └── database.js          # Database connection
├── controllers/
│   ├── authController.js    # Authentication business logic
│   ├── schoolController.js  # School-related business logic
│   ├── parentController.js  # Parent profile business logic
│   └── applicationController.js # Application business logic
├── models/
│   ├── User.js             # User model (admin, parent, teacher)
│   ├── School.js           # School model
│   ├── Parent.js           # Parent profile model
│   └── Application.js      # School application model
├── routes/
│   ├── auth.js             # Authentication routes
│   ├── schools.js          # School-related routes
│   ├── parents.js          # Parent profile routes
│   └── applications.js     # Application routes
├── middleware/
│   └── auth.js             # Authentication middleware
├── scripts/
│   └── seed-schools.js     # Sample data seeding
├── server.js               # Main server file
├── package.json
├── .env.example
└── README.md
\`\`\`

## Architecture Benefits

✅ **MVC Pattern**: Clear separation between Models, Views (API responses), and Controllers
✅ **Business Logic Separation**: Controllers handle business logic, routes handle HTTP routing
✅ **Better Error Handling**: Centralized error handling in controllers
✅ **Code Reusability**: Controllers can be easily tested and reused
✅ **Maintainability**: Easy to locate and modify specific functionality

## Installation

1. Clone the repository
2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

3. Create `.env` file from `.env.example`:
   \`\`\`bash
   cp .env.example .env
   \`\`\`

4. Update environment variables in `.env`

5. Start MongoDB service

6. Seed sample schools (optional):
   \`\`\`bash
   node scripts/seed-schools.js
   \`\`\`

7. Start the server:
   \`\`\`bash
   # Development
   npm run dev
   
   # Production
   npm start
   \`\`\`

## API Endpoints

### Admin Management
- `POST /api/admin/create-parent` - Create parent account
- `POST /api/admin/create-teacher` - Create teacher account
- `GET /api/admin/users` - Get all users with filters
- `GET /api/admin/stats` - Get user statistics
- `PUT /api/admin/users/:id/status` - Update user status
- `POST /api/admin/users/:id/reset-password` - Reset user password
- `DELETE /api/admin/users/:id` - Delete user account

### Authentication (Updated)
- `POST /api/auth/first-login` - First time login with password change
- `POST /api/auth/login` - Regular login
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `GET /api/auth/profile` - Get current user profile

### Schools
- `GET /api/schools` - Get all schools with search/filter
- `GET /api/schools/:id` - Get school by ID
- `GET /api/schools/nearby/:lat/:lng` - Get nearby schools

### Parent Profile
- `GET /api/parents/profile` - Get parent profile
- `PUT /api/parents/profile` - Update parent profile
- `POST /api/parents/children` - Add child
- `PUT /api/parents/children/:id` - Update child
- `DELETE /api/parents/children/:id` - Remove child

### Applications
- `POST /api/applications` - Submit school application
- `GET /api/applications/my-applications` - Get parent's applications
- `GET /api/applications/:id` - Get application by ID
- `PUT /api/applications/:id` - Update application
- `DELETE /api/applications/:id` - Cancel application

## Usage Examples

### Register a Parent
\`\`\`bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "parent@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe",
    "phoneNumber": "+91-9876543210"
  }'
\`\`\`

### Search Schools
\`\`\`bash
curl "http://localhost:5000/api/schools?search=bright&city=mumbai&minFee=5000&maxFee=15000"
\`\`\`

### Submit Application
\`\`\`bash
curl -X POST http://localhost:5000/api/applications \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "schoolId": "SCHOOL_ID",
    "childName": "David Sienfeld",
    "childAge": 4,
    "parentName": "John Doe",
    "phoneNumber": "+91-9876543210",
    "emailAddress": "parent@example.com",
    "emergencyContact": "+91-9876543211",
    "address": "123 Main Street, Mumbai",
    "notes": "Child loves learning and playing"
  }'
\`\`\`

## Postman Collection

Import the `postman-collection.json` file into Postman to test all API endpoints. The collection includes:

- Pre-configured environment variables
- Authentication token management
- Sample requests for all endpoints
- Test scripts for token extraction

## Environment Variables

\`\`\`env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/school_management
JWT_SECRET=your-super-secret-jwt-key-here
\`\`\`

## Error Handling

The API includes comprehensive error handling:
- Input validation errors
- Authentication/authorization errors
- Database errors
- Custom business logic errors

All errors return consistent JSON format:
\`\`\`json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error (development only)"
}
\`\`\`

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Role-based access control
- Input validation and sanitization
- CORS enabled
- Environment variable protection

## Setup Instructions

1. Create Super Admin:
   \`\`\`bash
   node scripts/create-admin.js
   \`\`\`

2. Login as Super Admin:
   - Email: admin@school.com
   - Password: admin123

3. Create Parent/Teacher accounts through admin panel

4. Users login with temporary credentials and change password

## Future Enhancements

- File upload for documents/images
- Email notifications
- SMS integration
- Payment gateway integration
- Real-time notifications
- Admin and teacher modules
- Advanced reporting
- Mobile app API optimization

## Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## License

MIT License - see LICENSE file for details
