const db = require("../config/database");


const User = {


    create:(user, callback)=>{


        const sql = `
        INSERT INTO users
        (name,email,phone,password)

        VALUES (?,?,?,?)
        `;


        db.query(
            sql,

            [
                user.name,
                user.email,
                user.phone,
                user.password
            ],

            callback
        );


    },



    findByEmail:(email,callback)=>{


        const sql =
        "SELECT * FROM users WHERE email=?";


        db.query(

            sql,

            [email],

            callback

        );


    }


};


module.exports = User;