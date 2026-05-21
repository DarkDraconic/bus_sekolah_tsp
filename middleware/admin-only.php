<?php
session_start();

if(!isset($_SESSION['login'])){
    header("Location: ../login.html");
    exit;
}

if($_SESSION['role'] != 'admin'){
    header("Location: ../login.html");
    exit;
}
?>