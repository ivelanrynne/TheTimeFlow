import React, { useState } from 'react'
import { useAuthStore } from '@/stores/useAuthStore'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Lock, User, Mail, Clock, IdCard } from 'lucide-react'
import { Button } from '@/components/ui/button'

const SignUpPage = () => {
  const [formData, setFormData] = useState({
    displayName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    if (errorMessage) setErrorMessage('')
  }
  
  const { signUp } = useAuthStore()
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('Mật khẩu xác nhận không khớp!')
      return
    }

    await signUp(formData.username, formData.password, formData.email, formData.displayName);

    setIsLoading(true)
    try {
      // TODO: Kết nối API đăng ký (/api/auth/signup)
      console.log('Sign up data:', formData)
    } finally {
      setIsLoading(false)
      navigate('/signin') // Chuyển hướng đến trang đăng nhập sau khi đăng ký thành công
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-border bg-card p-8 shadow-sm">
        {/* Header / Brand */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-2">
            <Clock className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground font-heading">
            Tạo tài khoản mới
          </h1>
          <p className="text-sm text-muted-foreground">
            Bắt đầu quản lý thời gian với <span className="font-semibold text-foreground">TheTimeFlow</span>
          </p>
        </div>

        {/* Error message alert */}
        {errorMessage && (
          <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive border border-destructive/20">
            {errorMessage}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Display Name */}
          <div className="space-y-1.5">
            <label
              htmlFor="displayName"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Họ và tên (Tên hiển thị)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground pointer-events-none">
                <IdCard className="w-4 h-4" />
              </span>
              <input
                id="displayName"
                name="displayName"
                type="text"
                required
                value={formData.displayName}
                onChange={handleChange}
                placeholder="Ví dụ: Nguyễn Văn A"
                className="w-full h-10 rounded-md border border-input bg-transparent pl-10 pr-3 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Username */}
          <div className="space-y-1.5">
            <label
              htmlFor="username"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Tên đăng nhập
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground pointer-events-none">
                <User className="w-4 h-4" />
              </span>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={formData.username}
                onChange={handleChange}
                placeholder="nguyenvana"
                className="w-full h-10 rounded-md border border-input bg-transparent pl-10 pr-3 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Email
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground pointer-events-none">
                <Mail className="w-4 h-4" />
              </span>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="email@example.com"
                className="w-full h-10 rounded-md border border-input bg-transparent pl-10 pr-3 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Mật khẩu
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground pointer-events-none">
                <Lock className="w-4 h-4" />
              </span>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="Nhập ít nhất 6 ký tự"
                className="w-full h-10 rounded-md border border-input bg-transparent pl-10 pr-10 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label
              htmlFor="confirmPassword"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Xác nhận mật khẩu
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground pointer-events-none">
                <Lock className="w-4 h-4" />
              </span>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Nhập lại mật khẩu"
                className="w-full h-10 rounded-md border border-input bg-transparent pl-10 pr-10 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-10 mt-2 cursor-pointer"
          >
            {isLoading ? 'Đang tạo tài khoản...' : 'Đăng ký'}
          </Button>
        </form>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          Đã có tài khoản?{' '}
          <Link
            to="/signin"
            className="font-medium text-foreground underline underline-offset-4 hover:text-primary transition-colors"
          >
            Đăng nhập ngay
          </Link>
        </div>
      </div>
    </div>
  )
}

export default SignUpPage