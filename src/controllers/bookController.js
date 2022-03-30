const bookModel = require("../models/bookModel");
const userModel = require("../models/userModel");
const reviewModel = require("../models/reviewModel");

const isValid = function (value) {
    if (typeof (value) === undefined || typeof (value) === null) { return false }
    if ((value).length == 0) { return false }
    if (typeof (value) === "string" && (value).length > 0) { return true }
}

const isRightFormatISBN = function (ISBN) {
    return /^\+?([1-9]{4})\)?[-. ]?([0-9]{4})[-. ]?([0-9]{5})$/.test(ISBN);
}

const isValidObjectId = function (objectId) {
    return /^[0-9a-fA-F]{24}$/.test(objectId)
}

const isRightFormatReleasedAt = function (releasedAt) {
    return /((\d{4}[\/-])(\d{2}[\/-])(\d{2}))/.test(releasedAt)
}

const createBooks = async function (req, res) {
    try {
        const data = req.body;
        const { title, excerpt, userId, ISBN, category, releasedAt } = data;


        if (Object.keys(data) == 0) { return res.status(400).send({ status: false, message: 'No data provided' }) }

        if (!isValid(title)) { return res.status(400).send({ status: false, message: 'Title is required' }) }

        let isUniquetitle = await bookModel.findOne({ title: title })
        if (isUniquetitle) { return res.status(400).send({ status: false, message: 'Title already exist' }) }

        if (!isValid(excerpt)) { return res.status(400).send({ status: false, message: 'Excerpt is required' }) }

        if (!isValid(userId)) { return res.status(400).send({ status: false, message: 'User Id is required' }) }

        if (!isValidObjectId(userId)) { return res.status(400).send({ status: false, message: 'Please provide a valid userId' }) }

        let isValidid = await userModel.findOne({ _id: userId })
        if (!isValidid) { return res.status(400).send({ status: false, message: 'There is no such id in database, Please provide a valid User Id' }) }

        if (!isValid(ISBN)) { return res.status(400).send({ status: false, message: 'ISBN is required' }) }

        if (!isRightFormatISBN(ISBN)) { return res.status(400).send({ status: false, message: 'Please provide a valid ISBN' }) }

        let isUniqueISBN = await bookModel.findOne({ ISBN: ISBN })
        if (isUniqueISBN) { return res.status(400).send({ status: false, message: 'ISBN already exist, please check your input' }) }

        if (!isValid(category)) { return res.status(400).send({ status: false, message: 'Category is required' }) }
 
        if (!isValid(releasedAt)) { return res.status(400).send({ status: false, message: 'Released date is required' }) }

        if (!isRightFormatReleasedAt(releasedAt)) { return res.status(400).send({ status: false, message: 'Please provide a valid released date in format YYYY/MM/DD '})}

        data.subcategory = data.subcategory.filter(x => x.trim());
        if (data.subcategory.length == 0) { return res.status(400).send({status: false, message: 'Subcategory is required'})}

        //.Validation ends.//


        const newBook = await bookModel.create(data);

        return res.status(201).send({ status: true, message: 'success', data: newBook })

    }
    catch (error) {
        console.log(error)
        return res.status(500).send({ message: error.message })
    }
}


const getBooks = async function (req, res) {
    try {
        const data = req.query

        const books = await bookModel.find({ $and: [data, { isDeleted: false }] }).select({ _id: 1, title: 1, excerpt: 1, userId: 1, category: 1, releasedAt: 1, reviews: 1 }).collation({locale:"en"}).sort({title:1})

        if (books.length == 0) return res.status(404).send({ status: false, message: "No books Available." })
        return res.status(200).send({ status: true, message: 'Books list', count: books.length, data: books });
    }


    catch (error) {
        return res.status(500).send({ status: false, message: error.message });
    }
}



const getBooksById = async function (req, res) {
    try {
        const bookId = req.params.bookId
        if (Object.keys(bookId) == 0) {
            return res.status(400).send({ status: false, message: "Please Provide a valid bookId in path params" })
        }

        if(!isValidObjectId(bookId)) { return res.status(400).send({status: false, message: 'Please provide a valid Book Id'})}
        const getBook = await bookModel.find({ _id: bookId, isDeleted: false }).select({ ISBN: 0 })
        if (getBook.length==0) {
            return res.status(404).send({ status: false, message: "no book exist with this id" })
        }
        const reviewData = await reviewModel.find({ bookId: bookId, isDeleted: false })
            .select({ bookId: 1, reviewedBy: 1, reviewedAt: 1, rating: 1, review: 1 })

        const newData = {
            _id: getBook[0]._id,
            title: getBook[0].title,
            excerpt: getBook[0].excerpt,
            userId: getBook[0].userId,
            category: getBook[0].category,
            subcategory: getBook[0].subcategory,
            reviews: getBook[0].reviews,
            isDeleted: getBook[0].isDeleted,
            deletedAt: getBook[0].deletedAt,
            releasedAt: getBook[0].releasedAt,
            reviewsData: reviewData
        }

        return res.status(200).send({ status: true, message: 'Books list', data: newData })
    }
    catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}





const updateBooks = async function (req, res) {
    try {
        let book_Id = req.params.bookId
        let data = req.body
        if (!book_Id) return res.status(400).send({ status: false, message: "Book Id is required" })

        if (Object.keys(data) == 0) { return res.status(400).send({ status: false, message: 'No data provided' }) }

        if(!isValidObjectId(book_Id)) { return res.status(400).send({ status: false, message: 'please provide a valid id' })}

        let book = await bookModel.findById(book_Id)
        if (!book) return res.status(404).send({ status: false, message: "Book does not exists" })

        let is_Deleted = book.isDeleted
        if (is_Deleted == true) return res.status(404).send({ status: false, message: "Book is already deleted" })

        let isUniqueTitle = await bookModel.findOne({ title: data.title })
        if (isUniqueTitle) { return res.status(400).send({ status: false, message: 'Title already exist, Please provide a unique title' }) }

        let isUniqueISBN = await bookModel.findOne({ ISBN: data.ISBN })
        if (isUniqueISBN) { return res.status(400).send({ status: false, message: 'ISBN already exist, Please provide a unique ISBN' }) }


        let updatedBook = await bookModel.findOneAndUpdate({ _id: book_Id }, {...data}, { new: true })

        return res.status(202).send({ status: true, message: 'Success', data: updatedBook })
    }
    catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}


const deleteBooks = async function (req, res) {
    try {
        let book_id = req.params.bookId;
        if (Object.keys(book_id) == 0) { return res.status(400).send({ status: false, message: 'Id not provided' }) }

        if(!isValidObjectId(book_id)) { return res.status(400).send({ status: false, message: 'please provide a valid id' })}

        let book = await bookModel.findById(book_id)
        if (!book) { return res.status(404).send({ status: false, message: 'No Book present with this id, please provide a valid id ' }) }

        let is_Deleted = book.isDeleted
        if (is_Deleted == true) { return res.status(404).send({ status: false, message: "Book is already deleted" }) }

        let deletedBook = await bookModel.findOneAndUpdate({ _id: book_id }, { $set: { isDeleted: true, deletedAt: new Date() } }, { new: true })

        let deletedReview = await reviewModel.findOneAndUpdate({bookId: book_id}, {$set: { isDeleted: true }}, { new: true})

        return res.status(200).send({ status: true, message: 'Book deleted successfully', deletedBook })

    }
    catch (error) {
        return res.status(500).send({ status: false, msg: error.message })
    }
}



module.exports.createBooks = createBooks;
module.exports.getBooks = getBooks;
module.exports.getBooksById = getBooksById;
module.exports.updateBooks = updateBooks;
module.exports.deleteBooks = deleteBooks;