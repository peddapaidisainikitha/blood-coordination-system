# 🩸 EBDCS: Emergency Blood Donation Coordination System

A full-stack web application for emergency blood coordination between patients, donors, and blood banks.

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) v16 or higher
- [MongoDB](https://www.mongodb.com/try/download/community) (local) OR a MongoDB Atlas connection string
- (Optional) Twilio account for SMS alerts
- (Optional) Gmail or SMTP account for email alerts

---

### Installation

**1. Navigate to the backend folder**
```bash
cd blood-coordination-system/backend
```

**2. Install dependencies**
```bash
npm install
```

**3. Configure environment variables**

Copy `.env.example` to `.env` and fill in your values:
```bash
copy .env.example .env
```

Minimum required settings in `.env`:
```
MONGODB_URI=mongodb://localhost:27017/blood_coordination
JWT_SECRET=your_long_secret_key_here
PORT=5000
```

**4. Seed the database** (creates admin account + sample blood banks)
```bash
node utils/seedData.js
```

**5. Start the server**
```bash
npm run dev      # Development (with auto-restart via nodemon)
npm start        # Production
```

**6. Open the app**

Visit: **http://localhost:5000**

---

## 🔑 Default Login Credentials (after seeding)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@bloodbank.com | Admin@123456 |

Register your own patient account at: http://localhost:5000/pages/register-patient.html

---

## 📁 Project Structure

```
blood-coordination-system/
├── backend/
│   ├── config/
│   │   └── db.js                  # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js      # Registration & login
│   │   ├── bloodBankController.js # Blood bank & inventory
│   │   ├── donorController.js     # Donor management
│   │   ├── emergencyController.js # Emergency requests
│   │   └── adminController.js     # Admin operations
│   ├── middleware/
│   │   ├── auth.js                # JWT authentication
│   │   └── errorHandler.js        # Global error handler
│   ├── models/
│   │   ├── User.js                # Patient model
│   │   ├── Donor.js               # Donor model
│   │   ├── Admin.js               # Admin model
│   │   ├── BloodBank.js           # Blood bank model
│   │   ├── BloodInventory.js      # Inventory model
│   │   ├── EmergencyRequest.js    # Emergency request model
│   │   ├── DonationHistory.js     # Donation history model
│   │   └── Notification.js        # Notification model
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── bloodBankRoutes.js
│   │   ├── donorRoutes.js
│   │   ├── emergencyRoutes.js
│   │   └── adminRoutes.js
│   ├── utils/
│   │   ├── notifications.js       # Email & SMS helpers
│   │   ├── bloodCompatibility.js  # Blood group matching
│   │   └── seedData.js            # Database seeder
│   ├── server.js                  # Express app entry point
│   ├── .env                       # Environment variables
│   └── package.json
│
└── frontend/
    ├── css/
    │   └── style.css              # Complete stylesheet
    ├── data/
    │   └── blood-banks.json       # Public blood bank directory
    ├── js/
    │   ├── api.js                 # API client
    │   └── utils.js               # UI utilities
    ├── pages/
    │   ├── login.html             # Unified login (patient/donor/admin)
    │   ├── register-patient.html  # Patient registration
    │   ├── register-donor.html    # Donor registration
    │   ├── blood-search.html      # Search blood banks by city/state
    │   ├── blood-banks.html       # Blood banks directory
    │   ├── emergency-request.html # Emergency request form
    │   ├── patient-dashboard.html # Patient dashboard
    │   ├── donor-dashboard.html   # Donor dashboard
    │   ├── admin-dashboard.html   # Admin dashboard
    │   ├── about.html             # About & eligibility info
    │   └── contact.html           # Contact form
    └── index.html                 # Home page
```

---

## 🔌 API Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register/patient` | Register patient |
| POST | `/api/auth/register/donor` | Register donor |
| POST | `/api/auth/login` | Login (patient/donor/admin) |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/change-password` | Change password |

### Blood Banks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/blood-banks` | List all blood banks |
| GET | `/api/blood-banks/nearby` | Nearby banks (lat/lng) |
| GET | `/api/blood-banks/search` | Search by blood group |
| GET | `/api/blood-banks/:id` | Bank details + inventory |
| POST | `/api/blood-banks` | Add bank (admin) |
| PUT | `/api/blood-banks/:id/inventory` | Update inventory (admin) |

### Donors
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/donors/nearby` | Nearby donors |
| GET | `/api/donors/profile` | Own profile (donor) |
| PUT | `/api/donors/availability` | Update availability |
| GET | `/api/donors/history` | Donation history |
| GET | `/api/donors/notifications` | Donor notifications |

### Emergency Requests
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/emergency` | Create request (patient) |
| GET | `/api/emergency/my-requests` | Patient's requests |
| GET | `/api/emergency/for-donor` | Compatible requests for donor |
| PUT | `/api/emergency/:id/respond` | Accept/decline (donor) |
| PUT | `/api/emergency/:id/cancel` | Cancel request |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/stats` | Dashboard statistics |
| GET | `/api/admin/users` | All patients |
| PUT | `/api/admin/donors/:id/verify` | Verify donor |
| PUT | `/api/admin/blood-banks/:id/verify` | Verify blood bank |
| PUT | `/api/admin/requests/:id/flag-duplicate` | Flag duplicate |

---

## ⚙️ Optional Configuration

### Email Notifications (Gmail)
1. Enable 2FA on your Gmail account
2. Generate an App Password
3. Set `EMAIL_USER` and `EMAIL_PASS` in `.env`

### SMS Notifications (Twilio)
1. Create a Twilio account at twilio.com
2. Get Account SID, Auth Token, and a phone number
3. Set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` in `.env`

---

## 🛡️ Security Features

- Passwords hashed with bcrypt (salt rounds: 12)
- JWT tokens with configurable expiry
- Role-based access control (patient / donor / admin / superadmin)
- Duplicate request detection
- Donor eligibility checks (56-day rule)
- Donor contact information hidden until request is accepted
- Input validation on all forms

---

## 📱 Responsive Design

The UI is fully responsive across:
- Desktop (1200px+)
- Tablet (768px – 1199px)
- Mobile (< 768px)

---

## 🔧 Troubleshooting

**MongoDB connection fails:**
- Ensure MongoDB is running: `mongod --dbpath C:\data\db`
- Or use a MongoDB Atlas connection string

**Port already in use:**
- Change `PORT` in `.env`

**Emails not sending:**
- Check Gmail App Password (not account password)
- Ensure `EMAIL_USER` and `EMAIL_PASS` are set

**Donors not receiving notifications:**
- Verify donors have `isVerified: true` in the database
- Check admin dashboard and verify donor accounts
