import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach } from 'vitest';
import App from '../App';

describe('Full Application User Flow', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('completes the full journey: login -> view datasets -> create job', async () => {
        const user = userEvent.setup();
        render(<App />);

        // 1. LOGIN PHASE
        // Wait for AuthView
        await screen.findByText(/Welcome to SelfTune/i);

        // Fill login form
        const emailInput = screen.getByPlaceholderText(/you@email.com/i);
        const passwordInput = screen.getByPlaceholderText(/••••••••/i);
        const signInButton = screen.getByRole('button', { name: /Sign In/i });

        await user.type(emailInput, 'test@selftune.app');
        await user.type(passwordInput, 'password123');
        await user.click(signInButton);

        // 2. DASHBOARD PHASE
        // Verify successful login and redirect to Dashboard
        await screen.findByText(/Active Training Jobs/i);
        await screen.findByText(/Test UI User/i);

        // 3. DATASETS PHASE
        // Click "Datasets" in Sidebar
        const datasetsLink = screen.getByRole('button', { name: /Datasets/i });
        await user.click(datasetsLink);

        // Verify Datasets Table
        await screen.findByText(/Training Dataset A/i);
        expect(screen.getByText(/1,500 rows/i)).toBeInTheDocument(); // Format in StepDataset.jsx is LocaleString

        // 4. FINE-TUNE PHASE
        const fineTuneLink = screen.getByRole('button', { name: /Fine-Tune/i });
        await user.click(fineTuneLink);

        // Step 1: Base Model
        console.log('--- STEP 1: BASE MODEL ---');
        await screen.findByText(/1. Select Base Model/i);
        const mistralModel = screen.getByText(/Mistral 7B/i);
        await user.click(mistralModel);

        const jobNameInput = screen.getByPlaceholderText(/e.g. customer-support-bot/i);
        await user.type(jobNameInput, 'Integration Test Job');

        const continueBtn1 = screen.getByRole('button', { name: /Continue/i });
        await user.click(continueBtn1);

        // Step 2: Choose Dataset
        console.log('--- STEP 2: DATASET ---');
        await screen.findByText(/2. Choose Dataset/i);
        const datasetOption = screen.getByText(/Training Dataset A/i);
        await user.click(datasetOption);

        const continueBtn2 = screen.getByRole('button', { name: /Continue/i });
        await user.click(continueBtn2);

        // Step 3: Hyperparameters
        console.log('--- STEP 3: SUBMIT ---');
        await screen.findByText(/3. Hyperparameters/i);

        const submitButton = screen.getByRole('button', { name: /Submit Training Job/i });
        await user.click(submitButton);

        // 5. JOBS PHASE
        // Verify redirect to Jobs & Metrics (which shows Experiment Queue)
        await screen.findByText(/Experiment Queue/i);

        // Verify our new job is in the list (it appears twice: once in queue, once in details)
        const jobElements = await screen.findAllByText(/Integration Test Job/i);
        expect(jobElements.length).toBeGreaterThanOrEqual(1);

        console.log('Full User Flow Test: PASSED ✅');
    }, 30000);
});
