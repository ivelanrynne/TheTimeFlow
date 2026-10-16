import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/useAuthStore'
import { useNavigate } from 'react-router-dom'

const Logout = () => {
    const { signOut } = useAuthStore()
    const navigate = useNavigate()

    const handleLogout = async () => {
        try {
            await signOut()
            navigate('/signin') // Chuyển hướng đến trang đăng nhập sau khi đăng xuất thành công
        } catch (error) {
            console.error('Error signing out:', error)
        }
    }

    return (
        <Button onClick={handleLogout}>
            Logout
        </Button>
    )
}

export default Logout