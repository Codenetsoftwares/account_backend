CREATE TABLE admin_user (
    adminID int(11) NOT NULL AUTO_INCREMENT,
    adminEmail varchar(65) NOT NULL,
    adminName varchar(65) NOT NULL,
    adminPassword varchar(65) NOT NULL,
    PRIMARY KEY (adminID)
);

CREATE TABLE withdraw_user (
    userID int(11) NOT NULL AUTO_INCREMENT,
    userEmail varchar(65) NOT NULL,
    userName varchar(65) NOT NULL,
    userPassword varchar(65) NOT NULL,
    PRIMARY KEY (userID)
);

CREATE TABLE deposit_user (
    userID int(11) NOT NULL AUTO_INCREMENT,
    userEmail varchar(65) NOT NULL,
    userName varchar(65) NOT NULL,
    userPassword varchar(65) NOT NULL,
    PRIMARY KEY (userID)
);

CREATE TABLE transaction (
    id INTEGER NOT NULL auto_increment,
    transactionID VARCHAR(65) NOT NULL,
    transactionType VARCHAR(65),
    withdrawAmount INT(11),
    depositAmount INT(11),
    status VARCHAR(65),
    createdAt DATETIME,
    updatedAt DATETIME,
    PRIMARY KEY (id),
    UNIQUE KEY (transactionID)
);