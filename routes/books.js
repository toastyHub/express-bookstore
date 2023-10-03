const express = require("express");
const Book = require("../models/book");
const ExpressError = require("../expressError");

const jsonschema = require("jsonschema");
// Schema for validating the addition of a book to the DB (all fields are required)
const bookSchema = require("../schemas/bookSchema.json")
// Removed "isbn" requirement 
const addBookSchema = require("../schemas/addBookSchema.json")

const router = new express.Router();


/** GET / => {books: [book, ...]}  */

router.get("/", async function (req, res, next) {
  try {
    // Attempt to retrieve a list of books from the database based on query parameters
    const books = await Book.findAll(req.query);
    // Return the list of books as a JSON response
    return res.json({ books });
  } catch (err) {
    // If an error occurs during the try block (e.g., a database error),
    // catch the error and pass it to the next middleware or error handler using `next(err)`
    return next(err);
  }
});

/** GET /[id]  => {book: book} */

router.get("/:id", async function (req, res, next) {
  try {
    // Attempt to find a book in the database based on the provided :id parameter
    const book = await Book.findOne(req.params.id);
    // If a book with the specified :id is found, return it as a JSON response
    return res.json({ book });
  } catch (err) {
    // If an error occurs during the try block (e.g., book not found or database error),
    // catch the error and pass it to the next middleware or error handler using `next(err)`
    return next(err);
  }
});

/** POST /   bookData => {book: newBook}  */

router.post("/", async function (req, res, next) {
  try {
    // Validate the request body against a JSON schema using jsonschema.validate
    const validate = jsonschema.validate(req.body, bookSchema);
    // If validation fails (the request body doesn't match the schema)
    if (!validate.valid) {
      // Extract the error messages from the validation result and store them in listOfErrors
      let listOfErrors = validate.errors.map(err => err.stack);
      // Create a custom error message with the list of validation errors
      // and return it with a status code of 400 (Bad Request)
      let error = new ExpressError(listOfErrors, 400);
      return next(error)
    }

    // If the request body is valid, create a new book record using the Book model's create method
    const book = await Book.create(req.body);
    // Return a JSON response containing the created book with a 201 status code (Created)
    return res.status(201).json({ book });
  } catch (err) {
    // If an error occurs during the try block, pass it to the next middleware or error handler
    return next(err);
  }
});

/** PUT /[isbn]   bookData => {book: updatedBook}  */

router.put("/:isbn", async function (req, res, next) {
  try {
    // Check if the request body contains a key "isbn"
    if ("isbn" in req.body) {
      // If "isbn" is found in the request body, it did not come from frontend
      // message and return it with a status code of 400 (Bad Request)
      let error = new ExpressError("Invalid", 400)
      return next(error)
    }
    
    // Validate the request body against a JSON schema using jsonschema.validate
    const validation = jsonschema.validate(req.body, addBookSchema);
    // If validation fails (the request body doesn't match the schema)
    if (!validation.valid) {
      // Extract the error messages from the validation result and store them in listOfErrors
      let listOfErrors = validation.errors.map(err => err.stack);
      // Create a custom error message with the list of validation errors
      // and return it with a status code of 400 (Bad Request)
      let error = new ExpressError(listOfErrors, 400);
      return next(error)
    }

    // If the request body is valid and doesn't contain an "isbn" key,
    // update the book with the provided ISBN using the Book model's update method
    const book = await Book.update(req.params.isbn, req.body);
    // Return a JSON response containing the updated book
    return res.json({ book });
  } catch (err) {
    // If an error occurs during the try block, pass it to the next middleware or error handler
    return next(err);
  }
});


/** DELETE /[isbn]   => {message: "Book deleted"} */

router.delete("/:isbn", async function (req, res, next) {
  try {
    let error = new ExpressError("Deleted!", 204)
    // Remove the book with the specified ISBN using the Book model's remove method
    await Book.remove(req.params.isbn);
    // Return a JSON response with the custom success message
    return res.json(error);
  } catch (err) {
    // If an error occurs during the try block (e.g., book not found or database error),
    // catch the error and pass it to the next middleware or error handler using `next(err)`
    return next(err);
  }
});

module.exports = router;
