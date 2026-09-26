\# Fitness \& Nutrition Tracker with AI Insights



A web-based fitness and nutrition tracking application that helps users monitor meals, workouts, calorie intake, and daily wellness data.



\## Features



\* User authentication and profile management

\* Meal logging with calorie and macronutrient tracking

\* AI-powered meal analysis

\* AI fitness and nutrition coach

\* Daily calorie and nutrition summaries

\* Workout tracking

\* Fitness and nutrition articles

\* Searchable food database

\* Progress and activity dashboard

\* Responsive interface for desktop and mobile



\## Tech Stack



\* \*\*Frontend:\*\* React, TypeScript, Vite

\* \*\*UI:\*\* Tailwind CSS, shadcn/ui

\* \*\*Backend:\*\* Supabase Edge Functions

\* \*\*Database:\*\* PostgreSQL (Supabase)

\* \*\*Authentication:\*\* Supabase Auth

\* \*\*AI:\*\* Google Gemini API



\## Project Structure



```text

src/

├── components/       # Reusable UI components

├── pages/            # Application pages

├── hooks/            # Custom React hooks

└── lib/              # Utility functions



supabase/

├── functions/        # Backend Edge Functions

└── migrations/       # Database migrations

```



\## Getting Started



\### 1. Clone the repository



```bash

git clone https://github.com/YOUR\_USERNAME/fitness-tracker-ai.git

cd fitness-tracker-ai

```



\### 2. Install dependencies



```bash

npm install

```



\### 3. Configure environment variables



Create a `.env` file and add your Supabase project credentials:



```env

VITE\_SUPABASE\_URL=your\_supabase\_url

VITE\_SUPABASE\_ANON\_KEY=your\_supabase\_anon\_key

```



\### 4. Start the development server



```bash

npm run dev

```



The application will be available at the local development URL shown in the terminal.



\## AI Features



The application uses Google Gemini through Supabase Edge Functions for:



\* Natural-language fitness and nutrition assistance

\* Automated meal analysis

\* Nutritional estimation from meal descriptions and images



API keys are stored as server-side environment secrets and are not exposed in the frontend.



\## Database



The application uses PostgreSQL through Supabase with user-specific data protection and authentication-based access control.



\## License



This project was developed as an academic/personal software project.



