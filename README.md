# Gemstone Laboratory Management System

A complete gemstone testing and certification system built with Next.js 14, TypeScript, TailwindCSS, and MySQL.

## Features

- **Packet Entry**: Register new gemstone packets with customer details and generate unique tracking IDs with QR codes
- **Testing Module**: Perform comprehensive gemstone testing and record detailed results
- **Report Generation**: Automatically generate PDF certificates with test results
- **Search & Tracking**: Search packets by ID, QR code, or customer name
- **Authentication**: Secure staff login system with JWT
- **Dashboard**: Overview of system statistics and recent activity

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, TailwindCSS
- **Backend**: Next.js API Routes
- **Database**: MySQL with Prisma ORM
- **Authentication**: JWT with bcrypt password hashing
- **QR Codes**: qrcode library
- **PDF Generation**: pdf-lib library

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Database Setup

1. Create a MySQL database on Hostinger (or your preferred provider)
2. Copy `env.example` to `.env` and update the database connection string:

```env
DATABASE_URL="mysql://username:password@your-host:3306/gemstone_lab"
JWT_SECRET="your-super-secret-jwt-key-here"
```

### 3. Initialize Database

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push
```

### 4. Create Admin User

You can create an admin user by making a POST request to `/api/auth/register`:

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@lab.com", "password": "admin123", "role": "admin"}'
```

### 5. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to access the application.

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   ├── packets/       # Packet management
│   │   ├── tests/         # Testing endpoints
│   │   └── reports/       # Report generation
│   ├── dashboard/         # Staff dashboard
│   ├── login/             # Login page
│   ├── packet-entry/      # Packet creation
│   ├── testing/           # Testing module
│   └── search/            # Search & tracking
├── components/            # Reusable components
├── lib/                   # Utility functions
│   ├── auth.ts           # Authentication utilities
│   ├── prisma.ts         # Database connection
│   ├── qr-generator.ts   # QR code generation
│   ├── pdf-generator.ts  # PDF report generation
│   └── utils.ts          # General utilities
└── types/                # TypeScript type definitions
```

## Database Schema

The system uses the following main entities:

- **User**: Staff authentication
- **Packet**: Gemstone packets with customer details
- **Test**: Test results for each packet
- **Report**: Generated PDF reports

## API Endpoints

### Authentication
- `POST /api/auth/login` - Staff login
- `POST /api/auth/register` - Create new user

### Packets
- `GET /api/packets` - List all packets (with optional search)
- `POST /api/packets` - Create new packet

### Tests
- `GET /api/tests` - List tests (with optional packet filter)
- `POST /api/tests` - Create test results

## Deployment

### Frontend (Vercel)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push

### Database (Hostinger)
1. Create MySQL database on Hostinger
2. Update `DATABASE_URL` in environment variables
3. Run `npm run db:push` to initialize schema

## Usage

1. **Staff Login**: Access the system with staff credentials
2. **Packet Entry**: Register new gemstone packets
3. **Testing**: Perform tests and record results
4. **Reports**: Download generated PDF certificates
5. **Search**: Find and track packets by various criteria

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Protected API routes
- Input validation and sanitization

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.