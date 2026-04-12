# ScanServe - Dashboard

A high-end, luxury-themed staff dashboard for real-time order management and menu control.

## Deployment on Vercel

To deploy this application on Vercel, follow these steps:

1.  **Push to GitHub**: Push your code to a GitHub repository.
2.  **Import to Vercel**: Go to [vercel.com](https://vercel.com) and import your repository.
3.  **Configure Environment Variables**: In the Vercel project settings, add the following environment variables:
    *   `VITE_SUPABASE_URL`: Your Supabase Project URL.
    *   `VITE_SUPABASE_ANON_KEY`: Your Supabase Anonymous Key.
4.  **Deploy**: Click "Deploy". Vercel will automatically detect the Vite configuration and build the project.

## Local Development

1.  Install dependencies:
    ```bash
    npm install
    ```
2.  Create a `.env` file based on `.env.example` and fill in your Supabase credentials.
3.  Start the development server:
    ```bash
    npm run dev
    ```

## Tech Stack

*   **Frontend**: React 19, Vite, Tailwind CSS 4.
*   **Backend**: Supabase (Database & Realtime).
*   **Animations**: Motion (Framer Motion).
*   **Icons**: Lucide React.
*   **Styling**: Dark Luxury aesthetic with Playfair Display and Inter typography.
