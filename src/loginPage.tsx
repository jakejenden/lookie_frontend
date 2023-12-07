// LoginPage.tsx
import React, { useState, ChangeEvent, FormEvent } from 'react';
import axios from 'axios';
import { Form, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';

interface FormData {
  Username: string;
  Password: string;
}

const LoginPage: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    Username: '',
    Password: '',
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const response = await axios.post('http://localhost:3030/login', formData);

      // Assuming the backend returns a token upon successful login
      const token = response.data.token;

      // You can store the token in local storage or a state management solution
      // Example: localStorage.setItem('token', token);

      alert('Login successful!');
      // Redirect the user or perform other actions after successful login
    } catch (error) {
      const errorMessage = (error as Error).message;

      alert('Invalid username/email or password');
      // Handle error, e.g., show an error message to the user
      console.error('Login failed:', errorMessage);
    }
  };

  return (
    <div className="dark-background text-center" style={{ height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
      <h2 className="text-white mb-4">Login</h2>
      <Form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: '350px' }}>
        <Form.Group controlId="Username" className="mb-3">
          <Form.Label className="text-white">Username/Email:</Form.Label>
          <Form.Control
            type="text"
            name="Username"
            value={formData.Username}
            onChange={handleChange}
            required
          />
        </Form.Group>

        <Form.Group controlId="Password" className="mb-3">
          <Form.Label className="text-white">Password:</Form.Label>
          <Form.Control
            type="Password"
            name="Password"
            value={formData.Password}
            onChange={handleChange}
            required
          />
        </Form.Group>

        <Button variant="primary" type="submit">
          Login
        </Button><br /><br />

        <Link to="/create-user" className="btn btn-secondary mt-2"  style={{ fontSize: '10px', padding: '3px' }}>
          Create User
        </Link>
      </Form>
    </div>
  );
};

export default LoginPage;
