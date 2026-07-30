const express = require("express");
const app = express();

const cors = require("cors");
const bodyParser = require("body-parser");


const userController = require('./controllers/UserController')
const groupController = require('./controllers/GroupController')
const sectionController = require('./controllers/SectionController')
const partMasterController = require('./controllers/PartMasterController')
const locationController = require('./controllers/LocationController')
const controlLotController = require('./controllers/ControlLotController')
const issueController = require('./controllers/IssueController')


app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));


// user
app.post('/api/user/create', (req, res) => userController.create(req,res))
app.post('/api/user/list', (req, res) => userController.list(req,res))
app.post('/api/user/signIn', (req, res) => userController.signIn(req,res))

// group

app.post('/api/group/add', (req,res) => groupController.add(req,res))
app.get('/api/group/list',(req,res) => groupController.list(req,res))

// section
app.post('/api/section/add', (req,res) => sectionController.add(req,res))
app.get('/api/section/list',(req,res) => sectionController.list(req,res))

//partMaster
app.post('/api/partMaster/add', (req,res) => partMasterController.add(req,res))
app.get('/api/partMaster/list',(req,res) => partMasterController.list(req,res))

//Location
app.post('/api/location/add', (req,res) => locationController.add(req,res))
app.get('/api/location/list',(req,res) => locationController.list(req,res))

//controlLot
app.post('/api/controlLot/add', (req,res) => controlLotController.add(req,res))
app.get('/api/controlLot/list',(req,res) => controlLotController.list(req,res))


//issue 
app.post('/api/issue/fetchHeaderTemp', (req,res) => issueController.fetchHeaderTemp(req,res))
app.post('/api/issue/createHeaderTemp', (req,res) => issueController.createHeaderTemp(req,res))
app.post('/api/issue/createBoxTemp', (req,res) => issueController.createBoxTemp(req,res))
app.post('/api/issue/fetchBoxTempByHeadId', (req,res) => issueController.fetchBoxTempByHeadId(req,res))
app.post('/api/issue/editHeaderTemp', (req,res) => issueController.fetchBoxTempByHeadId(req,res))




app.listen(3001, () => {
    console.log("API Server Running...");
});


