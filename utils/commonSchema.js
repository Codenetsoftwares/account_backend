import { body } from "express-validator";
export const validateLogin = [
  body("userName").notEmpty().withMessage("Username is required"),
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isString()
    .withMessage("Password must be a string")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
];


export const validateCreateAdmin = [
  body("firstname").notEmpty().withMessage("First name is required"),
  body("lastname").notEmpty().withMessage("Last name is required"),
  body("userName")
    .notEmpty()
    .withMessage("Username is required"),
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isString()
    .withMessage("Password must be a string"),
 body("roles").isArray().withMessage("Role is Required"),
];

export const validateInteroducer =[
  body("firstname").notEmpty().withMessage("First name is required"),
  body("lastname").notEmpty().withMessage("Last name is required"),
  body("userName")
    .notEmpty()
    .withMessage("Username is required"),
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isString()
    .withMessage("Password must be a string"),
 //body("role").isArray().withMessage("Role is Required"),

]

export const userValidator = [
  body('firstname')
    .notEmpty()
    .withMessage('Firstname is required')
    .isString()
    .withMessage('Firstname must be a string'),

  body('lastname').notEmpty().withMessage('Lastname is required').isString().withMessage('Lastname must be a string'),

  body('userName').notEmpty().withMessage('User Name is required').isString().withMessage('User Name must be a string'),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
];

export const validateRole = [body('roles').notEmpty().withMessage('Role is required')];