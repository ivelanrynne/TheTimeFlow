import { useAuthStore } from '@/stores/useAuthStore';
import { useEffect, useState } from "react";
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
    const { accessToken, user, loading, refreshToken, fetchMe } = useAuthStore();
    const [ starting, setStaring ] = useState(true);

    const init = async () => {
        if (!accessToken) {
          await refreshToken();
        }

        if (accessToken && !user) {
          await fetchMe();
        }

        setStaring(false);
    }

    useEffect(() => {
        init();
    }, []);

    if (starting || loading) {
        return <div className='flex items-center justify-center h-full'>Loading...</div>;
    }

    if (!accessToken) {
        // Nếu người dùng chưa đăng nhập, bạn có thể chuyển hướng đến trang đăng nhập hoặc hiển thị thông báo
        return (
            <Navigate
                to="/signin"
                replace
            />
        );
    }

    return (
        <Outlet></Outlet>
    )
}

export default ProtectedRoute