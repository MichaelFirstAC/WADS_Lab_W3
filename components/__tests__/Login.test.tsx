import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
} from 'firebase/auth';
import Login from '../Login';

const mockPush = jest.fn();

jest.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signInWithPopup: jest.fn(),
  GoogleAuthProvider: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
  }),
}));

jest.mock('@/lib/firebase', () => ({
  auth: {},
}));

describe('Login Component', () => {
  beforeEach(() => {
    // Clear any previous state between tests
    jest.clearAllMocks();
    mockPush.mockClear();
  });

  describe('Rendering', () => {
    it('renders login form with all required elements', () => {
      render(<Login />);

      expect(screen.getByText('Welcome Back')).toBeInTheDocument();
      expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
      expect(screen.getByTestId('email-input')).toBeInTheDocument();
      expect(screen.getByTestId('password-input')).toBeInTheDocument();
      expect(screen.getByTestId('submit-button')).toBeInTheDocument();
      expect(screen.getByTestId('google-signin-button')).toBeInTheDocument();
    });

    it('renders email and password labels', () => {
      render(<Login />);

      expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
    });

    it('renders sign up toggle', () => {
      render(<Login />);

      const signUpToggle = screen.getByTestId('toggle-auth-mode');
      expect(signUpToggle).toBeInTheDocument();
    });

    it('has correct initial input values', () => {
      render(<Login />);

      const emailInput = screen.getByTestId('email-input') as HTMLInputElement;
      const passwordInput = screen.getByTestId('password-input') as HTMLInputElement;

      expect(emailInput.value).toBe('');
      expect(passwordInput.value).toBe('');
    });
  });

  describe('Input Handling', () => {
    it('updates email input value on change', async () => {
      const user = userEvent.setup();
      render(<Login />);

      const emailInput = screen.getByTestId('email-input') as HTMLInputElement;
      
      await user.type(emailInput, 'test@example.com');
      expect(emailInput.value).toBe('test@example.com');
    });

    it('updates password input value on change', async () => {
      const user = userEvent.setup();
      render(<Login />);

      const passwordInput = screen.getByTestId('password-input') as HTMLInputElement;
      
      await user.type(passwordInput, 'password123');
      expect(passwordInput.value).toBe('password123');
    });

    it('outputs both email and password on change', async () => {
      const user = userEvent.setup();
      render(<Login />);

      const emailInput = screen.getByTestId('email-input') as HTMLInputElement;
      const passwordInput = screen.getByTestId('password-input') as HTMLInputElement;

      await user.type(emailInput, 'user@example.com');
      await user.type(passwordInput, 'securePassword123');

      expect(emailInput.value).toBe('user@example.com');
      expect(passwordInput.value).toBe('securePassword123');
    });
  });

  describe('Form Validation', () => {
    it('shows email error when email is empty', async () => {
      const user = userEvent.setup();
      render(<Login />);

      const submitButton = screen.getByTestId('submit-button');
      await user.click(submitButton);

      const emailError = screen.getByTestId('email-error');
      expect(emailError).toBeInTheDocument();
      expect(emailError).toHaveTextContent('Email is required');
    });

    it('shows password error when password is empty', async () => {
      const user = userEvent.setup();
      render(<Login />);

      const submitButton = screen.getByTestId('submit-button');
      await user.click(submitButton);

      const passwordError = screen.getByTestId('password-error');
      expect(passwordError).toBeInTheDocument();
      expect(passwordError).toHaveTextContent('Password is required');
    });

    it('shows email error for invalid email format', async () => {
      const user = userEvent.setup();
      render(<Login />);

      const emailInput = screen.getByTestId('email-input') as HTMLInputElement;
      const passwordInput = screen.getByTestId('password-input') as HTMLInputElement;
      const submitButton = screen.getByTestId('submit-button');

      await user.type(emailInput, 'invalid-email');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      const emailError = screen.getByTestId('email-error');
      expect(emailError).toBeInTheDocument();
      expect(emailError).toHaveTextContent('Please enter a valid email');
    });

    it('shows password error when password is less than 6 characters', async () => {
      const user = userEvent.setup();
      render(<Login />);

      const emailInput = screen.getByTestId('email-input') as HTMLInputElement;
      const passwordInput = screen.getByTestId('password-input') as HTMLInputElement;
      const submitButton = screen.getByTestId('submit-button');

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'short');
      await user.click(submitButton);

      const passwordError = screen.getByTestId('password-error');
      expect(passwordError).toBeInTheDocument();
      expect(passwordError).toHaveTextContent('Password must be at least 6 characters');
    });

    it('clears error message when user starts typing', async () => {
      const user = userEvent.setup();
      render(<Login />);

      const submitButton = screen.getByTestId('submit-button');
      
      // Submit form to show errors
      await user.click(submitButton);
      
      let emailError = screen.getByTestId('email-error');
      expect(emailError).toBeInTheDocument();

      // Start typing to clear error
      const emailInput = screen.getByTestId('email-input');
      await user.type(emailInput, 'test@example.com');

      // Error should be gone
      expect(screen.queryByTestId('email-error')).not.toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('does not submit form with empty fields', async () => {
      const user = userEvent.setup();
      const signInMock = signInWithEmailAndPassword as jest.Mock;
      const signUpMock = createUserWithEmailAndPassword as jest.Mock;

      render(<Login />);

      const submitButton = screen.getByTestId('submit-button');
      await user.click(submitButton);

      expect(signInMock).not.toHaveBeenCalled();
      expect(signUpMock).not.toHaveBeenCalled();
    });

    it('submits form with valid data', async () => {
      const user = userEvent.setup();
      const signInMock = signInWithEmailAndPassword as jest.Mock;
      signInMock.mockResolvedValueOnce({ user: { uid: 'test-user' } });

      render(<Login />);

      const emailInput = screen.getByTestId('email-input');
      const passwordInput = screen.getByTestId('password-input');
      const submitButton = screen.getByTestId('submit-button');

      await user.type(emailInput, 'valid@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(signInMock).toHaveBeenCalledWith(
          expect.anything(),
          'valid@example.com',
          'password123'
        );
      });
    });

    it('shows success message after successful submission', async () => {
      const user = userEvent.setup();
      const signInMock = signInWithEmailAndPassword as jest.Mock;
      signInMock.mockResolvedValueOnce({ user: { uid: 'test-user' } });
      render(<Login />);

      const emailInput = screen.getByTestId('email-input');
      const passwordInput = screen.getByTestId('password-input');
      const submitButton = screen.getByTestId('submit-button');

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      // Wait for the success message to appear (after async operation completes)
      await waitFor(
        () => {
          expect(screen.getByTestId('success-message')).toBeInTheDocument();
        },
        { timeout: 2000 }
      );

      const successMessage = screen.getByTestId('success-message');
      expect(successMessage).toHaveTextContent('Login successful!');
    });

    it('clears form after successful submission', async () => {
      const user = userEvent.setup();
      const signInMock = signInWithEmailAndPassword as jest.Mock;
      signInMock.mockResolvedValueOnce({ user: { uid: 'test-user' } });
      render(<Login />);

      const emailInput = screen.getByTestId('email-input') as HTMLInputElement;
      const passwordInput = screen.getByTestId('password-input') as HTMLInputElement;
      const submitButton = screen.getByTestId('submit-button');

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(emailInput.value).toBe('');
        expect(passwordInput.value).toBe('');
      });
    });

    it('shows loading state while submitting', async () => {
      const user = userEvent.setup();
      const signInMock = signInWithEmailAndPassword as jest.Mock;
      let resolveSignIn: () => void;
      const signInPromise = new Promise<void>((resolve) => {
        resolveSignIn = resolve;
      });
      signInMock.mockReturnValueOnce(signInPromise);
      render(<Login />);

      const emailInput = screen.getByTestId('email-input');
      const passwordInput = screen.getByTestId('password-input');
      const submitButton = screen.getByTestId('submit-button') as HTMLButtonElement;

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      
      const clickPromise = user.click(submitButton);

      // Submit button should be loading immediately
      await waitFor(() => {
        expect(submitButton).toHaveTextContent('Signing in...');
      });
      resolveSignIn!();
      await clickPromise;
    });

    it('creates account when in sign up mode', async () => {
      const user = userEvent.setup();
      const signUpMock = createUserWithEmailAndPassword as jest.Mock;
      signUpMock.mockResolvedValueOnce({ user: { uid: 'new-user' } });

      render(<Login />);

      const toggleButton = screen.getByTestId('toggle-auth-mode');
      await user.click(toggleButton);

      const emailInput = screen.getByTestId('email-input');
      const passwordInput = screen.getByTestId('password-input');
      const submitButton = screen.getByTestId('submit-button');

      await user.type(emailInput, 'new@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(signUpMock).toHaveBeenCalledWith(
          expect.anything(),
          'new@example.com',
          'password123'
        );
      });

      const successMessage = await screen.findByTestId('success-message');
      expect(successMessage).toHaveTextContent('Account created!');
    });

    it('signs in with Google when Google button is clicked', async () => {
      const user = userEvent.setup();
      const googleSignInMock = signInWithPopup as jest.Mock;
      googleSignInMock.mockResolvedValueOnce({ user: { uid: 'google-user' } });

      render(<Login />);

      const googleButton = screen.getByTestId('google-signin-button');
      await user.click(googleButton);

      await waitFor(() => {
        expect(googleSignInMock).toHaveBeenCalledWith(expect.anything(), expect.anything());
      });
    });
  });

  describe('Button Behavior', () => {
    it('submit button is enabled initially', () => {
      render(<Login />);

      const submitButton = screen.getByTestId('submit-button') as HTMLButtonElement;
      expect(submitButton).not.toBeDisabled();
    });

    it('submit button shows correct text', () => {
      render(<Login />);

      const submitButton = screen.getByTestId('submit-button');
      expect(submitButton).toHaveTextContent('Sign In');
    });
  });

  describe('Accessibility', () => {
    it('has proper form labels associated with inputs', () => {
      render(<Login />);

      const emailInput = screen.getByLabelText('Email Address');
      const passwordInput = screen.getByLabelText('Password');

      expect(emailInput).toBeInTheDocument();
      expect(passwordInput).toBeInTheDocument();
    });

    it('email input has correct type attribute', () => {
      render(<Login />);

      const emailInput = screen.getByTestId('email-input') as HTMLInputElement;
      expect(emailInput.type).toBe('email');
    });

    it('password input has correct type attribute', () => {
      render(<Login />);

      const passwordInput = screen.getByTestId('password-input') as HTMLInputElement;
      expect(passwordInput.type).toBe('password');
    });

    it('form has novalidate attribute for custom validation', () => {
      const { container } = render(<Login />);

      const form = container.querySelector('form');
      expect(form).toHaveAttribute('novalidate');
    });
  });
});
