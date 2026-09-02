export function UnauthorizedState() {
    return (
        <section className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-amber-900 shadow-sm">
            <h1 className="text-xl font-bold">Trang này dành cho sinh viên</h1>
            <p className="mt-2 text-sm leading-6">
                Bạn đang đăng nhập bằng tài khoản giảng viên hoặc quản trị viên, vì vậy trang kết quả cá nhân của sinh viên sẽ không hiển thị ở đây.
            </p>
        </section>
    );
}
