<?php
session_start();
include "config/koneksi.php";

$username = mysqli_real_escape_string($conn, $_POST['username']);
$password = $_POST['password'];


// =======================
// LOGIN ADMIN
// =======================
$queryAdmin = mysqli_query($conn,
  "SELECT * FROM admin WHERE username='$username' LIMIT 1"
);

if(mysqli_num_rows($queryAdmin) > 0){

    $admin = mysqli_fetch_assoc($queryAdmin);

    if(password_verify($password, $admin['password'])){

        $_SESSION['login'] = true;
        $_SESSION['role']  = 'admin';

        $_SESSION['id_admin'] = $admin['id_admin'];
        $_SESSION['nama']     = $admin['nama'];
        $_SESSION['username'] = $admin['username'];

        header("Location: admin-dashboard.php");
        exit;
    }
}



// =======================
// LOGIN DRIVER
// =======================
$queryDriver = mysqli_query($conn,
  "SELECT * FROM sopir WHERE username='$username' LIMIT 1"
);

if(mysqli_num_rows($queryDriver) > 0){

    $driver = mysqli_fetch_assoc($queryDriver);

    if(password_verify($password, $driver['password'])){

        $_SESSION['login'] = true;
        $_SESSION['role']  = 'driver';

        $_SESSION['id_sopir'] = $driver['id_sopir'];
        $_SESSION['nama']     = $driver['nama'];
        $_SESSION['username'] = $driver['username'];

        header("Location: driver-dashboard.php");
        exit;
    }
}


// =======================
// GAGAL LOGIN
// =======================
echo "
<script>
alert('Username atau password salah!');
window.location='login.html';
</script>
";
?>