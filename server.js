require('dotenv').config();

const express = require('express');
const mariadb = require('mariadb'); 

const app = express();
app.use(express.json()); 

const pool = mariadb.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectionLimit: 5
}); 

app.get('/api/skins', async (req, res) => {
    let conn; 
    try {
        conn = await pool.getConnection(); 

        const rows = await conn.query(`
            SELECT 
                skins.id,
                skins.name AS skin_name,
                categories.name AS category_name,
                conditions.name AS condition_name,
                skins.price
            FROM skins 
            JOIN categories ON skins.category_id = categories.id
            JOIN conditions ON skins.condition_id = conditions.id
            `);
            res.json(rows);
    } catch (err) {
        console.log('Databasfel: ', err);
    } finally {
        if(conn) conn.release(); 
    }
});

app.post('/api/skins', async (req, res) => {
    
})

app.get('/api/categories', async (req, res) => {
    let conn;
    try{
        conn = await pool.getConnection();
        const rows = await conn.query(`SELECT * FROM categories`);
        res.json(rows);
    }catch(err){
        console.log('Databasfel:', err);
    }finally{
        if(conn) conn.release();
    }
});

app.get('/api/conditions', async (req, res) => {
    let conn; 
    try{
        conn = await pool.getConnection(); 
        const rows = await conn.query(`SELECT * FROM conditions`);
        res.json(rows); 
    }catch(err){
        console.log('Databasfel: ', err);
    }finally{
        if(conn) conn.release;
    }
})

const PORT = process.env.PORT || 3000; 
app.listen(PORT, () => {
    console.log(`The server is listening to port ${PORT}`);
    console.log(`http://localhost:${PORT}/api/skins`)
})