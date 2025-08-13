# 📧 MailFlow

MailFlow is a React + TypeScript web application designed for managing contacts, creating email campaigns, and sending emails using Nodemailer.  
This README documents **Phase 1** of the project.

---

## 🚀 Phase 1 Overview
In Phase 1, the following features were implemented:

- **Login Page** – Secure user login with form validation.
- **Register Page** – New user registration with proper input validation.
- **Dashboard** – Central place to view and navigate project features.
- **Contacts Page** – Add, view, and manage contacts.
- **Campaigns Page** – Create and manage email campaigns.

---

## 🛠 Tech Stack
- **Frontend**: React (TypeScript), TailwindCSS
- **Backend**: Node.js, Express.js
- **Email Service**: Nodemailer
- **Database**: MongoDB
- **Styling**: TailwindCSS

---
## 📚 API Documentation
The full API documentation is available via Swagger UI.

- **Local Development**: [http://localhost:5000/api-docs](http://localhost:5000/api-docs)
- **JSON Spec**: [http://localhost:5000/swagger.json](http://localhost:5000/swagger.json)

## 📸 Screenshots/Demo
Login Page
<img width="885" height="734" alt="login" src="https://github.com/user-attachments/assets/dba68fb5-340a-4e4e-b502-25f3395e573b" />
Register Page
<img width="865" height="895" alt="register" src="https://github.com/user-attachments/assets/db8ce087-5249-4014-a681-27bcf278c5bb" />
Dashboard Page
<img width="1893" height="898" alt="dashboard" src="https://github.com/user-attachments/assets/3bff6150-b5c8-49c2-9b1f-42682f882649" />
Contacts Page
<img width="1904" height="884" alt="contacts" src="https://github.com/user-attachments/assets/98f982c1-b27a-4152-8698-e9ddd45e40d9" />
Campaigns Page
<img width="1904" height="906" alt="campaigns" src="https://github.com/user-attachments/assets/50e5d87a-f74a-4809-8534-e6a5dfb85351" />
<img width="1435" height="823" alt="image" src="https://github.com/user-attachments/assets/937a8fbd-f61d-4ca5-8f77-bc665ad943a8" />



## 📂 Folder Structure
```plaintext
mailflow/
│
├── backend/
│   ├── src/
│   │   ├── controllers/    # Route handlers(contact , auth , campaigns)
│   │   ├── models/         # Database models(contact , auth , campaigns)
│   │   ├── routes/         # API endpoints(contact , auth , campaigns)
│   │   ├── services/       # sercice code(mailservice)
│   ├── server.js           # main server.js 
│   ├── .env                # Environment variables
│   ├── package.json
│
├── frontend/
│   ├── src/
|   |   ├── api/            # apiInstance
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Pages (Login, Dashboard, etc.)
│   │   ├── App.tsx
│   │   ├── index.tsx
│   │
│   ├── tailwind.config.js
│   ├── package.json
├── .env
├── screenshots/            # Screenshots for README
└── README.md



---

## ⚙️ Installation & Setup

### 1️⃣ Clone the repository
```bash
git clone https://github.com/your-username/mailflow.git
cd mailflow
