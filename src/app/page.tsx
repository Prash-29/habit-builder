"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios, { type AxiosError } from "axios";
import { Form, Input, Button, Alert, Checkbox } from "antd";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[0-9]{7,10}$/;

interface RegisterFields {
  email: string;
  phone: string;
}

interface LoginFields {
  identifier: string;
}

interface AdminFields {
  email: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const [registerForm] = Form.useForm<RegisterFields>();
  const [loginForm] = Form.useForm<LoginFields>();
  const [adminForm] = Form.useForm<AdminFields>();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showLogin, setShowLogin] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);

  // On mount: if userId in localStorage, go straight to dashboard
  useEffect(() => {
    const savedId = localStorage.getItem("userId");
    if (savedId) {
      router.replace(`/users/${savedId}`);
    }
  }, [router]);

  // --- Register ---
  async function handleRegister(values: RegisterFields) {
    setLoading(true);
    setError("");

    const { email, phone } = values;
    const name = email.split("@")[0];

    try {
      const { data: json } = await axios.post("/api/users", {
        name,
        email,
        contact: phone,
      });
      localStorage.setItem("userId", json.data._id);
      router.push(`/users/${json.data._id}`);
    } catch (err) {
      setLoading(false);
      const axiosErr = err as AxiosError<{ error?: string }>;
      const msg = axiosErr.response?.data?.error || "Registration failed.";
      setError(msg);

      // If duplicate — prompt the existing user checkbox
      if (axiosErr.response?.status === 409) {
        setShowLogin(true);
      }
    }
  }

  // --- Login (lookup existing user) ---
  async function handleLogin(values: LoginFields) {
    setLoading(true);
    setError("");

    const val = values.identifier.trim();
    const isEmail = EMAIL_REGEX.test(val);

    const params = isEmail ? `email=${encodeURIComponent(val)}` : `phone=${encodeURIComponent(val)}`;

    try {
      const { data } = await axios.get(`/api/users?${params}`);
      localStorage.setItem("userId", data.userId);
      router.push(`/users/${data.userId}`);
    } catch (err) {
      setLoading(false);
      const axiosErr = err as AxiosError<{ error?: string }>;
      setError(axiosErr.response?.data?.error || "Account not found.");
    }
  }

  // --- Admin login (email checked against allowed list, no DB entry) ---
  async function handleAdminLogin(values: AdminFields) {
    setLoading(true);
    setError("");

    const email = values.email.trim();
    try {
      await axios.post("/api/admin/login", { email });
      localStorage.setItem("adminEmail", email);
      router.push("/admin-user-dashboard");
    } catch (err) {
      setLoading(false);
      const axiosErr = err as AxiosError<{ error?: string }>;
      setError(axiosErr.response?.data?.error || "Not an authorized admin.");
    }
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-950 via-blue-800 to-blue-600 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Quote */}
        <div className="text-center mb-10 px-4">
          <div className="inline-block bg-white/10 rounded-2xl px-6 py-5 border border-white/20 backdrop-blur-sm">
            <p className="text-blue-100 text-lg italic leading-relaxed font-light">
              &ldquo;Small habits, compounded daily, build the person you want to become.&rdquo;
            </p>
            <p className="text-blue-300 text-sm mt-2 font-medium tracking-wide uppercase">
              Habit Tracker
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 shadow-2xl border border-white/20">
          <h1 className="text-3xl font-bold text-white mb-1 text-center">
            {showAdmin ? "Admin Login" : "Get Started"}
          </h1>
          <p className="text-blue-200 text-center text-sm mb-7">
            {showAdmin
              ? "Enter your admin email to continue"
              : showLogin
              ? "Find your account"
              : "Register with your email and phone number"}
          </p>

          {error && (
            <Alert
              title={error}
              type="error"
              showIcon
              className="mb-5 rounded-xl"
              closable={{ onClose: () => setError("") }}
            />
          )}

          {/* Admin / Login / Register — ternary */}
          {showAdmin ? (
            <Form
              form={adminForm}
              layout="vertical"
              onFinish={handleAdminLogin}
              requiredMark={false}
            >
              <Form.Item
                name="email"
                label={<span className="text-blue-200 text-xs font-semibold tracking-wider uppercase">Admin Email</span>}
                rules={[
                  { required: true, message: "Admin email is required." },
                  {
                    validator(_, value) {
                      if (!value) return Promise.resolve();
                      if (!EMAIL_REGEX.test(value))
                        return Promise.reject("Enter a valid email address.");
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <Input
                  placeholder="admin@example.com"
                  maxLength={254}
                  size="large"
                  className="rounded-xl bg-white/10 border-white/25 text-white placeholder:text-blue-300/60"
                />
              </Form.Item>

              <Form.Item className="mb-0">
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  block
                  size="large"
                  className="rounded-xl font-bold text-blue-800 bg-white hover:bg-blue-50! border-0 h-12"
                >
                  {loading ? "Checking..." : "Go to Dashboard"}
                </Button>
              </Form.Item>
            </Form>
          ) : showLogin ? (
            <Form
              form={loginForm}
              layout="vertical"
              onFinish={handleLogin}
              requiredMark={false}
            >
              <Form.Item
                name="identifier"
                label={<span className="text-blue-200 text-xs font-semibold tracking-wider uppercase">Your Email or Phone</span>}
                rules={[
                  { required: true, message: "Please enter your email or phone." },
                  {
                    validator(_, value) {
                      if (!value) return Promise.resolve();
                      if (value.length > 254)
                        return Promise.reject("Must be 254 characters or less.");
                      if (EMAIL_REGEX.test(value) || PHONE_REGEX.test(value))
                        return Promise.resolve();
                      return Promise.reject("Enter a valid email or phone number.");
                    },
                  },
                ]}
              >
                <Input
                  placeholder="you@example.com or 0712345678"
                  maxLength={254}
                  size="large"
                  className="rounded-xl bg-white/10 border-white/25 text-white placeholder:text-blue-300/60"
                />
              </Form.Item>

              <Form.Item className="mb-0">
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  block
                  size="large"
                  className="rounded-xl font-bold text-blue-800 bg-white hover:bg-blue-50! border-0 h-12"
                >
                  {loading ? "Finding..." : "Go to My Dashboard"}
                </Button>
              </Form.Item>
            </Form>
          ) : (
            <Form
              form={registerForm}
              layout="vertical"
              onFinish={handleRegister}
              requiredMark={false}
            >
              <Form.Item
                name="email"
                label={<span className="text-blue-200 text-xs font-semibold tracking-wider uppercase">Email Address</span>}
                rules={[
                  { required: true, message: "Email is required." },
                  {
                    validator(_, value) {
                      if (!value) return Promise.resolve();
                      if (value.length > 254)
                        return Promise.reject("Email must be 254 characters or less.");
                      if (!EMAIL_REGEX.test(value))
                        return Promise.reject("Enter a valid email address.");
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <Input
                  placeholder="you@example.com"
                  maxLength={254}
                  size="large"
                  className="rounded-xl bg-white/10 border-white/25 text-white placeholder:text-blue-300/60"
                />
              </Form.Item>

              <Form.Item
                name="phone"
                label={<span className="text-blue-200 text-xs font-semibold tracking-wider uppercase">Phone Number (optional)</span>}
                rules={[
                  {
                    validator(_, value) {
                      if (!value) return Promise.resolve();
                      if (value.length > 10)
                        return Promise.reject("Phone must be 10 digits or less.");
                      if (!PHONE_REGEX.test(value))
                        return Promise.reject("Enter a valid phone number (7–10 digits).");
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <Input
                  placeholder="0712345678"
                  maxLength={10}
                  size="large"
                  className="rounded-xl bg-white/10 border-white/25 text-white placeholder:text-blue-300/60"
                />
              </Form.Item>

              <Form.Item className="mb-0 mt-2">
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  block
                  size="large"
                  className="rounded-xl font-bold text-blue-800 bg-white hover:bg-blue-50! border-0 h-12"
                >
                  {loading ? "Registering..." : "Register"}
                </Button>
              </Form.Item>
            </Form>
          )}

          {/* Toggles — below the forms */}
          <div className="mt-5 border-t border-white/15 pt-4 space-y-2">
            {!showAdmin && (
              <Checkbox
                checked={showLogin}
                onChange={(e) => {
                  setShowLogin(e.target.checked);
                  setError("");
                  registerForm.resetFields();
                  loginForm.resetFields();
                }}
                className="text-blue-200 text-sm"
              >
                I already have an account
              </Checkbox>
            )}
            <Checkbox
              checked={showAdmin}
              onChange={(e) => {
                setShowAdmin(e.target.checked);
                setShowLogin(false);
                setError("");
                registerForm.resetFields();
                loginForm.resetFields();
                adminForm.resetFields();
              }}
              className="text-blue-200 text-sm"
            >
              Admin login
            </Checkbox>
          </div>

        </div>
      </div>
    </div>
  );
}
