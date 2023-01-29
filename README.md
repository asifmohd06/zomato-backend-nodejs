# zomato-backend-nodejs

## *what is this project*

- *backend for zomato react clone for creating new restaurant data , adding menu, authenticating users, uploding images of restaurants and menu items*
- *currently in development*
- *build on nodejs and express*
- *database used - mongoDB*
- *image resources are hosted on cloudinary*
- *authentication is done using passport node package*

## *pre-requisites*

- *NodeJs*
- *MongoDB account*
- *Cloudinary account*

## *Commands*


- npm i - *installs all required dependancies*
- npm start - *starts the server on localhost 5000*

## *Api Endpoints*

- #### get
	- /cities - *sends all the city data*
	- /cities/search/:cityName - *sends details of corresponding city*
	- /restaurants/logout - *for logging out clients*

- #### Post
	- /restaurants/register - *for registering new account*
		- required fields
			 - mail id
			 - username
			 - password
			
	- /restaurants/add - *for adding new restaurant __( should be formData )__*

		![menuform](https://res.cloudinary.com/fakename/image/upload/v1674972268/Screenshot_2023-01-29_at_11-30-56_React_App_cgepks.png)
		
		![formparams](https://res.cloudinary.com/fakename/image/upload/v1674974788/rest_wes7u2.png)
		
	 - /restaurants/:id/addmenu - *for adding menu __( should be formData )__*
	 
		 ![menuparams](https://res.cloudinary.com/fakename/image/upload/v1674973651/menu_dyuodg.png)
		 
	- /restaurants/login - *for logging in*
		- required fields
			- username
			- password

##### *currently full CRUD functions are not supported*
only creating and reading is available as of now
rest will be updated soon
