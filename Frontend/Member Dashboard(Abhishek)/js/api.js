// ===============================
// SPRING BOOT API CONFIGURATION
// ===============================


const API_BASE_URL =
    "http://localhost:8080/api";


// GET MEMBER DASHBOARD

async function getMemberDashboard() {

    const response = await fetch(

        `${API_BASE_URL}/member/dashboard`

    );


    return await response.json();

}


// GET ALL BOOKS

async function getBooks() {

    const response = await fetch(

        `${API_BASE_URL}/books`

    );


    return await response.json();

}


// GET BORROWED BOOKS

async function getBorrowedBooks() {

    const response = await fetch(

        `${API_BASE_URL}/member/borrowed-books`

    );


    return await response.json();

}


// RENEW BOOK

async function renewBookAPI(transactionId) {

    const response = await fetch(

        `${API_BASE_URL}/member/renew/${transactionId}`,

        {

            method: "POST"

        }

    );


    return await response.json();

}