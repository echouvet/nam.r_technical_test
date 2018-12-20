const 	express = require('express')
const	http = require("http")
const	path = require('path')
const	fetch = require('node-fetch')
const	mysql = require('mysql')
const	empty = require('is-empty')
const	eschtml = require('htmlspecialchars')
const 	download = require('download')

const    app = express()
const    server = http.createServer(app)

app.use('/datasets', express.static(path.join(__dirname, 'datasets')))
app.set('view engine', 'ejs')

var con = mysql.createConnection({
    host: "localhost",
    user: "root", // CHANGE CREDENTIALS HERE
    password: "root42"
})
con.connect((err) => { if (err) throw err
   	con.query('CREATE DATABASE IF NOT EXISTS `data`', (err) => { if (err) throw err })
	con.query('USE `data`', (err) => { if (err) throw err })
	
	var users = `CREATE TABLE IF NOT EXISTS datatable ( \
	id INT AUTO_INCREMENT PRIMARY KEY, \
	page INT, \
	title VARCHAR(255), \
	latest VARCHAR(255))`
	con.query(users, (err) => { if (err) throw err }) 
})

server.listen(8080)

async function scrapper(page)
{
	try {
		let requete = "https://www.data.gouv.fr/api/1/datasets/?page=" + page + "&page_size=1"
		let fetching = await fetch(requete)
		let data = await fetching.json()
		let sql = 'INSERT INTO datatable (page, title, latest) VALUES (?, ?, ?)'

		data.data[0].resources.forEach(el => {
			download(el.latest, path.join(__dirname, 'datasets'), {filename: eschtml(el.title)}).catch(err => console.log(err) );
			con.query(sql, [page, eschtml(el.title), eschtml(el.latest)], (err) => { if (err) throw err })
		})
	} catch(err) { console.log(err) }
}

async function createdata(res)
{
	try {
		await Promise.all([scrapper(3001), scrapper(3002), scrapper(3003), scrapper(3004), scrapper(3005)])
		con.query('SELECT * FROM datatable', (err, response) => { if (err) throw err
			res.render('index.ejs', {data: response})
		})
	} catch(err) {console.log(err) }
}


app.get('/', (req, res) => {
	con.query('SELECT * FROM datatable', (err, response) => { if (err) throw err
		if (empty(response))
			createdata(res)
		else
			res.render('index.ejs', {data: response})
	})
})
.get('*', (req, res) => {
	res.redirect('/')
})