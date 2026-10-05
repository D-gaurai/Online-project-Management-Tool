# GeForce - Online Project Management Tool

A full-stack academic project built with Spring Boot (backend) and HTML/CSS/vanilla JavaScript (frontend), backed by MySQL.

---

## 1. What You Need To Install (do this first)

| Tool | What it's for | Link |
|---|---|---|
| **JDK 17** (Java Development Kit) | Runs the Spring Boot backend | https://adoptium.net/ (choose version 17, LTS) |
| **Apache Maven** | Builds the backend project, downloads dependencies | https://maven.apache.org/download.cgi |
| **MySQL Server** | The database | https://dev.mysql.com/downloads/installer/ |
| **MySQL Workbench** | GUI to view/manage your database | Comes bundled with MySQL Installer above |
| **VS Code** | Code editor | https://code.visualstudio.com/ |
| **Postman** | For testing backend APIs directly | https://www.postman.com/downloads/ |
| **Git** | Version control, for GitHub | https://git-scm.com/downloads |

### VS Code Extensions to install (open VS Code → Extensions tab → search and install):
- **Extension Pack for Java** (by Microsoft) — lets VS Code understand and run Java/Maven projects
- **Spring Boot Extension Pack** (by VMware/Pivotal) — adds a "Run" button for Spring Boot apps
- **Live Server** (by Ritwick Dey) — lets you open the frontend HTML files with a real local server (needed so `fetch()` calls work properly)

### How to check installs worked (open a terminal and run):
```
java -version      → should show version 17.x
mvn -version        → should show Maven version + point to Java 17
mysql --version      → should show a MySQL version
```

---

## 2. Folder Structure

```
ProjectManagement/
├── backend/              → Spring Boot Java project
│   ├── src/
│   ├── pom.xml
│   └── .gitignore
├── frontend/              → HTML/CSS/JS website
│   ├── index.html, login.html, register.html, dashboard.html,
│   │   projects.html, project-details.html, tasks.html, profile.html
│   ├── css/style.css
│   └── js/ (api.js, common.js, auth.js, dashboard.js, projects.js,
│             project-details.js, tasks.js, profile.js)
├── database/
│   └── schema.sql        → reference only, NOT required to run manually
└── README.md              → this file
```

---

## 3. Database Setup (do this before running the backend)

1. Open **MySQL Workbench**, connect to your local MySQL server.
2. Run this single command:
   ```sql
   CREATE DATABASE project_management;
   ```
3. That's it — you do NOT need to run `schema.sql` manually. When the backend starts for the first time, Hibernate (Spring's database engine) will automatically create all the tables (`users`, `projects`, `project_members`, `tasks`, `comments`, `notifications`) inside `project_management` for you.

---

## 4. Open the Project in VS Code

1. Open VS Code → **File → Open Folder** → select the `ProjectManagement` folder (the outer one, containing both `backend` and `frontend`).
2. Wait a few seconds — the Java extension will detect `backend/pom.xml` and automatically start indexing the Maven project. You'll see a small loading notification in the bottom right corner; let it finish.

---

## 5. Set Environment Variables (important — never hardcode passwords)

The backend reads your database password and JWT secret from environment variables, not from any file. Before running, set these in your terminal **in the same terminal window you'll use to run the app**:

**Windows (PowerShell):**
```powershell
$env:DB_USERNAME="root"
$env:DB_PASSWORD="your_mysql_password"
$env:JWT_SECRET="thisIsALongRandomSecretKeyAtLeast32CharactersLong"
```

**Mac/Linux (bash/zsh):**
```bash
export DB_USERNAME=root
export DB_PASSWORD=your_mysql_password
export JWT_SECRET=thisIsALongRandomSecretKeyAtLeast32CharactersLong
```

(`MAIL_USERNAME` and `MAIL_APP_PASSWORD` are optional right now — the app will still run fine without them since they're only used for the email notification feature planned for a later phase.)

---

## 6. Run the Backend

**Option A — Using the terminal (most reliable):**
```bash
cd backend
mvn spring-boot:run
```

**Option B — Using VS Code's Spring Boot extension:**
Open `backend/src/main/java/com/projectmanager/backend/ProjectmanagementApplication.java`, click the small **Run** button that appears above the `main` method.
(Note: Option B only picks up environment variables if you started VS Code itself from a terminal where you already set them — Option A is simpler and safer while you're learning.)

**Expected result:** terminal shows `Tomcat started on port(s): 8080` with no red errors. Leave this terminal running — this is your live backend server.

---

## 7. Run the Frontend

1. In VS Code's file explorer, right-click `frontend/login.html`.
2. Click **"Open with Live Server"** (this option appears because of the Live Server extension you installed).
3. Your browser opens automatically at something like `http://127.0.0.1:5500/frontend/login.html`.

Do **not** just double-click the HTML file to open it directly in a browser (`file://...` links) — the login/register calls to the backend will fail due to browser security rules. Always use Live Server.

---

## 8. Test It End-to-End

1. On the Register page, create an account (try role = MANAGER first, so you can create projects).
2. You'll be logged in automatically and land on the Dashboard.
3. Go to **Projects → New Project**, create one.
4. Open the project, add a task, assign it, add a comment, change its status.
5. Register a second account (role = MEMBER), note its numeric User ID (visible via `GET /api/users/me` in Postman, or ask a teammate), and add it as a project member from the Members tab.

---

## 9. Common Errors & Fixes

| Error | Cause | Fix |
|---|---|---|
| `Access denied for user 'root'` | Wrong DB_PASSWORD | Re-check the environment variable in Step 5 |
| `Unknown database 'project_management'` | Forgot Step 3 | Run the `CREATE DATABASE` command |
| Login/Register button does nothing, console shows CORS or Failed to fetch | Opened HTML file directly instead of via Live Server | Re-open using "Open with Live Server" (Step 7) |
| `Failed to configure a DataSource` | Environment variables not set before running `mvn spring-boot:run` | Set them in the SAME terminal window before running the command |
| Port 8080 already in use | Backend already running elsewhere, or previous run didn't stop | Stop the other process, or close and reopen the terminal |

---

## 10. Progressive Web App (PWA)
This project is configured as a Progressive Web App (PWA). You can install it directly to your desktop or mobile device.
1. Run the frontend via Live Server.
2. Look for the 'Install' icon in the address bar (Chrome/Edge).
3. Click it to install the app locally.

11. Final Status
This covers a fully working core application (auth, projects, tasks, comments, notifications, dashboard with calendar, drill-down filtering).
Completed features include UI polish, PWA integration, and comprehensive viva documentation.
Pending optional phase: Email notifications using Spring Boot Mail.
