# Firebase Studio

This is a Next.js starter project for Firebase Studio.

## Getting Started

To get started with the project, take a look at `src/app/page.tsx`. This file is the main entry point for the application's user interface.

## Running Locally

To run this project on your local machine, please follow these steps:

### 1. Install Dependencies

First, you need to install all the necessary packages defined in `package.json`. Open your terminal in the project's root directory and run:

```bash
npm install
```

### 2. Set Up Firebase Credentials

For the application to connect to your Firebase project, you need to provide your credentials. This project uses Genkit, which relies on Google Application Default Credentials (ADC).

Follow the guide to [set up Application Default Credentials](https://cloud.google.com/docs/authentication/provide-credentials-adc#local-dev).

### 3. Run the Development Server

Once the dependencies are installed and your credentials are set up, you can start the Next.js development server. The `dev` script in `package.json` is configured to run the app.

```bash
npm run dev
```

This will start the development server, typically on port 9002. You can now open your browser and navigate to [http://localhost:9002](http://localhost:9002) to see your application running.
