# SyncWallet - Personal Finance System

A complete system for personal finance management, enabling control of transactions, bank accounts, credit cards, and monthly planning.

## Technologies Used

### Backend

- **Java 21**
- **Spring Boot 3.5.7**
- **Spring Data JPA** (Hibernate)
- **Spring Security** (JWT Authentication)
- **PostgreSQL** (Database)
- **Apache POI** (Excel Export/Import)
- **Lombok**
- **Docker**


### Frontend

- **React.js 19** (Vite)
- **TailwindCSS 4** (Styling)
- **i18next & react-i18next** (Multi-language Support)
- **Recharts** (Charts)
- **Axios** (API Integration)
- **Lucide React** (Icons)


## Features

- **Transaction Management**:
  - Incomes
  - Expenses
  - Transfers between accounts
  - Credit Card (with automatic installment handling)
- **Accounts & Balance Control**: Real-time balance tracking.
- **Customizable Categories**: Organize expenses by categories.
- **Monthly Planning**: Define spending limits per category/month with visual tracking.
- **Dashboard**: Overview with income vs. expense charts.
- **Multi-language Support**: Full support for **English** and **Portuguese** (BR).
- **Authentication**: Secure system with Login and Registration via JWT.


## How to Run

### Prerequisites

- Docker & Docker Compose
- Java 21 JDK (for manual backend execution)
- Node.js 18+ (for manual frontend execution)

### Via Docker Compose (Recommended)

The project is configured to run entirely via Docker.

1. Clone the repository:

```bash
git clone https://github.com/Fabio-ink/personal-finance-system.git
cd personal-finance-system
```

2. Start the containers (Frontend + Database):
   _Note: The backend currently runs locally for development, but can be dockerized._

```bash
docker compose up -d
```

3. Run the Backend:

```bash
./mvnw spring-boot:run
```

4. Access the application:

- Frontend: [http://localhost:5173](http://localhost:5173)
- Backend API: [http://localhost:8080](http://localhost:8080)

### Manual Configuration

**Database:**
Ensure you have PostgreSQL running on port `5432` with database `financeiro_db`, user `postgres`, and password `postgres`.

**Frontend:**

```bash
cd frontend
npm install
npm run dev
```

## Project Structure

- `/src`: Backend source code (Spring Boot)
- `/frontend`: Frontend source code (React)
- `/docker-compose.yml`: Container orchestration

## License

This project is for personal and educational use.
