-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Jun 26, 2023 at 07:34 AM
-- Server version: 10.4.27-MariaDB
-- PHP Version: 8.0.25

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `crm`
--

-- --------------------------------------------------------

--
-- Table structure for table `admin_user`
--

CREATE TABLE `admin_user` (
  `adminID` int(11) NOT NULL,
  `adminEmail` varchar(65) NOT NULL,
  `adminName` varchar(65) NOT NULL,
  `adminPassword` varchar(65) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `admin_user`
--

INSERT INTO `admin_user` (`adminID`, `adminEmail`, `adminName`, `adminPassword`) VALUES
(4, 'alok@yopmail.com', 'dada', '$2b$12$GH2O7nZ7Yw6I9nOkCxGWfu1mSo/YUHghTJ0cIyByxyRcGRRAng6G6'),
(5, 'alok123@yopmail.com', 'dada', '$2b$12$0iHKKYnEGLiIN.kebe7jrOoPlDabQolkqokG7bXwpETVkFOwYTG/e'),
(6, 'alok121@yopmail.com', 'dada', '$2b$12$mNYa.o0mgvgMFazdutXZA.jOJ6CyzeW7JF0SvSmWdk.V4wRBZFmrq'),
(7, 'alok156@yopmail.com', 'dada', '$2b$12$uYoM9Gb0kb70gzD7HLWY7..rQ1ODKjfOVBf5g3ZvGkxOO2TrN/Lua');

-- --------------------------------------------------------

--
-- Table structure for table `deposit_user`
--

CREATE TABLE `deposit_user` (
  `userID` int(11) NOT NULL,
  `userEmail` varchar(65) NOT NULL,
  `userName` varchar(65) NOT NULL,
  `userPassword` varchar(65) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `deposit_user`
--

INSERT INTO `deposit_user` (`userID`, `userEmail`, `userName`, `userPassword`) VALUES
(1, 'tester@yopmail.com', 'depositor', '123456'),
(2, 'alok1561@yopmail.com', 'dada', '$2b$12$uUy/llM/cffHm9HnQhEKje6smcL8XOsvQonSpwxN.Bk067RhAVlcG');

-- --------------------------------------------------------

--
-- Table structure for table `transaction`
--

CREATE TABLE `transaction` (
  `id` int(11) NOT NULL,
  `transactionID` varchar(65) NOT NULL,
  `transactionType` varchar(65) DEFAULT NULL,
  `withdrawAmount` int(11) DEFAULT NULL,
  `depositAmount` int(11) DEFAULT NULL,
  `status` varchar(65) DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `transaction`
--

INSERT INTO `transaction` (`id`, `transactionID`, `transactionType`, `withdrawAmount`, `depositAmount`, `status`, `createdAt`, `updatedAt`) VALUES
(1, 'w3as', 'upi', NULL, 2500, 'pending', '2023-06-21 12:24:49', '2023-06-21 12:24:49'),
(3, 'ffa3s', 'upi', NULL, NULL, 'pending', '2023-06-21 13:46:12', '2023-06-21 13:46:12'),
(5, 'adfa3s', 'upi', NULL, 2500, 'pending', '2023-06-21 13:47:17', '2023-06-21 13:47:17'),
(6, 'asdfes', 'upi', 2500, NULL, 'pending', '2023-06-21 13:48:25', '2023-06-21 13:48:25');

-- --------------------------------------------------------

--
-- Table structure for table `withdraw_user`
--

CREATE TABLE `withdraw_user` (
  `userID` int(11) NOT NULL,
  `userEmail` varchar(65) NOT NULL,
  `userName` varchar(65) NOT NULL,
  `userPassword` varchar(65) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `withdraw_user`
--

INSERT INTO `withdraw_user` (`userID`, `userEmail`, `userName`, `userPassword`) VALUES
(1, 'alok1561@yopmail.com', 'dada', '$2b$12$V3DB0pc0Ew54OGpSYoyjy.jQo2DNxCpIkyBnNLVLDnuXY6fgMq6Mu'),
(2, 'alok15617@yopmail.com', 'dada', '$2b$12$UXXK38xLY/5dlcXvHzA1z.twmQGyTVtagCCR6zL3LviFbF5jhTOBG');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admin_user`
--
ALTER TABLE `admin_user`
  ADD PRIMARY KEY (`adminID`);

--
-- Indexes for table `deposit_user`
--
ALTER TABLE `deposit_user`
  ADD PRIMARY KEY (`userID`);

--
-- Indexes for table `transaction`
--
ALTER TABLE `transaction`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `transactionID` (`transactionID`);

--
-- Indexes for table `withdraw_user`
--
ALTER TABLE `withdraw_user`
  ADD PRIMARY KEY (`userID`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `admin_user`
--
ALTER TABLE `admin_user`
  MODIFY `adminID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `deposit_user`
--
ALTER TABLE `deposit_user`
  MODIFY `userID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `transaction`
--
ALTER TABLE `transaction`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `withdraw_user`
--
ALTER TABLE `withdraw_user`
  MODIFY `userID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
