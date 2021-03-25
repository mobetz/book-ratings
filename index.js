

import fs from 'fs';
import path from 'path';
import csv from 'csv-parser'
import { fileURLToPath } from 'url'



let results = {}

function readCSV(stream_loc, functor) {
    return new Promise((resolve, reject) => {
        let stream = fs.createReadStream(stream_loc)
            .setEncoding("utf-8")
            .pipe(csv({separator: ";"}))

        stream.on("data", functor);
        stream.on("end", () => resolve(results));
        stream.on("error", error => reject(error));
    });
}

function generateRatings() {
    readCSV('./BX-Books.csv', (data) => {
        results[data.ISBN] = data;
        results[data.ISBN].ratings = []
    }).then((book_data) => {
        return readCSV('./BX-Book-Ratings.csv', (data) => {
            if (book_data[data.ISBN] && data.BookRating > 0) {
                book_data[data.ISBN].ratings.push(parseInt(data.BookRating));
            }
        })
    })
        .then((rated_books) => {
            return Object.values(rated_books)
                .filter((book) => book.ratings.length > 0)
                .map((book) => {
                    book.NumRatings = book.ratings.length;
                    book.AverageScore = book.ratings.reduce((x, y) => x + y) / book.ratings.length;
                    return book;
                })
        }).then((final_ratings) => {
        fs.writeFileSync("final-ratings.json", JSON.stringify(final_ratings))
    })
}




export default JSON.parse(fs.readFileSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)), "final-ratings.json"), "utf-8"))