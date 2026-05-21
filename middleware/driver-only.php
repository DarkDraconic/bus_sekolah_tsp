<?php
session_start();

if(!isset($_SESSION['login'])){
    header("Location: ../login.html");
    exit;
}

if($_SESSION['role'] != 'driver'){
    header("Location: ../login.html");
    exit;
}
?>