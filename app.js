const 	express = require('express')
const	http = require("http")
const	https = require("https")
const	path = require('path')
const	fs = require('fs')
const	fetch = require('node-fetch')
const	mysql = require('mysql')
const	empty = require('is-empty');
const	eschtml = require('htmlspecialchars')
const	download = require('download-file')

const    app = express()
const    server = http.createServer(app)

app.use('/datasets', express.static(path.join(__dirname, 'datasets')))
app.set('view engine', 'ejs')

var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "root42"
})
con.connect((err) => { if (err) throw err
   	con.query('CREATE DATABASE IF NOT EXISTS `data`', (err) => { if (err) throw err })
	con.query('USE `data`', (err) => { if (err) throw err })
	
	var users = `CREATE TABLE IF NOT EXISTS datatable ( \
	id INT AUTO_INCREMENT PRIMARY KEY, \
	page INT, \
	title VARCHAR(255), \
	latest VARCHAR(255))`;
	con.query(users, (err) => { if (err) throw err }) 
})

server.listen(8080)

async function scrapper(page)
{
	try {
		let requete = "https://www.data.gouv.fr/api/1/datasets/?page=" + page + "&page_size=1"
		let fetching = await fetch(requete);
		let data = await fetching.json();
		let sql = 'INSERT INTO datatable (page, title, latest) VALUES (?, ?, ?)'

		data.data[0].resources.forEach(el => {
			var options = {
			    directory: "./datasets/",
			    filename: eschtml(el.title)
			}
			console.log(el.latest)
			download(el.latest, options, (err) => { if (err) throw err 
				console.log(err)})
			con.query(sql, [page, eschtml(el.title), eschtml(el.latest)], (err) => { if (err) throw err })
		})
	} catch(err) { throw err }
}

async function createdata(res)
{
	await Promise.all([scrapper(3001), scrapper(3002), scrapper(3003), scrapper(3004), scrapper(3005)])
	con.query('SELECT * FROM datatable', (err, response) => {
		res.render('index.ejs', {response})
	})
}


app.get('*', (req, res) => {
	con.query('SELECT * FROM datatable', (err, response) => {
		if (empty(response))
			createdata(res)
		else
			res.render('index.ejs', {response})
	})
})