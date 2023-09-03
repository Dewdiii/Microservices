var express = require('express');
var router = express.Router();
var dbConn  = require('../lib/db');
 
// display user page
router.get('/', function(req, res, next) {      
    dbConn.query('SELECT * FROM products ORDER BY product_id desc',function(err,rows)     {
        if(err) {
            req.flash('error', err);
            // render to views/products/index.ejs
            res.render('products',{data:''});   
        } else {
            // render to views/products/index.ejs
            res.render('products',{data:rows});
        }
    });
});

// display add user page
router.get('/add', function(req, res, next) {    
    // render to add.ejs
    res.render('products/add', {
        product_name: '',
        quantity: '',
        price:'',
        supplier:''

    })
})

// add a new user
router.post('/add', function(req, res, next) {    

    let product_name = req.body.product_name;
    let quantity = req.body.quantity;
    let price = req.body.price;
    let supplier = req.body.supplier;
    let errors = false;

    if(product_name.length === 0 || quantity.length === 0 || price === 0 || supplier === 0  ) {
        errors = true;

        // set flash message
        req.flash('error', "Please enter name and quantity and price and supplier");
        // render to add.ejs with flash message
        res.render('products/add', {
            product_name: product_name,
            quantity: quantity,
            price: price,
            supplier:supplier
        })
    }


    if(!errors) {

        var form_data = {
            product_name: product_name,
            quantity: quantity,
            price: price,
            supplier:supplier
        }
        
        // insert query
        dbConn.query('INSERT INTO products SET ?', form_data, function(err, result) {
            
            if (err) {
                req.flash('error', err)
                 
                // render to add.ejs
                res.render('products/add', {
                    product_name: form_data.product_name,
                    quantity: form_data.quantity,
                    price: form_data.price,
                    supplier:form_data.supplier
                })
            } else {                
                req.flash('success', 'User successfully added');
                res.redirect('/products');
            }
        })
    }
})

// display edit user page
router.get('/edit/(:product_id)', function(req, res, next) {

    let product_id = req.params.product_id;
   
    dbConn.query('SELECT * FROM products WHERE product_id = ' + product_id, function(err, rows, fields) {
        if(err) throw err
         
        // if user not found
        if (rows.length <= 0) {
            req.flash('error', 'User not found with product_id = ' + product_id)
            res.redirect('/products')
        }
        // if user found
        else {
            // render to edit.ejs
            res.render('products/edit', {
                title: 'Edit User', 
                product_id: rows[0].product_id,
                product_name: rows[0].product_name,
                quantity: rows[0].quantity,
                price: rows[0].price,
                supplier: rows[0].supplier
            })
        }
    })
})

// update user data
router.post('/update/:product_id', function(req, res, next) {

    let product_id = req.params.product_id;
    let product_name = req.body.product_name;
    let quantity = req.body.quantity;
    let price = req.body.price;
    let supplier = req.body.supplier;
    let errors = false;

    if(product_name.length === 0 || quantity.length === 0 || price.length === 0 || supplier.length === 0 ) {
        errors = true;
        
       
        req.flash('error', "Please enter name and quantity and price and supplier");
        
        res.render('products/edit', {
            product_id: req.params.product_id,
            product_name: product_name,
            quantity: quantity,
            price: price,
            supplier:supplier
        })
    }

    // if no error
    if( !errors ) {   
 
        var form_data = {
            product_name: product_name,
            quantity: quantity,
            price: price,
            supplier:supplier
        }
        // update query
        dbConn.query('UPDATE products SET ? WHERE product_id = ' + product_id, form_data, function(err, result) {
           
            if (err) {
             
                req.flash('error', err)
             
                res.render('products/edit', {
                    product_id: req.params.product_id,
                    product_name: form_data.product_name,
                    quantity: form_data.quantity,
                    price:  form_data.price,
                    supplier: form_data.supplier
                })
            } else {
                req.flash('success', 'User successfully updated');
                res.redirect('/products');
            }
        })
    }
})
   
// delete user
router.get('/delete/(:product_id)', function(req, res, next) {

    let product_id = req.params.product_id;
     
    dbConn.query('DELETE FROM products WHERE product_id = ' + product_id, function(err, result) {
       
        if (err) {
            
            req.flash('error', err)
            // redirect to user page
            res.redirect('/products')
        } else {
            
            req.flash('success', 'User successfully deleted! product_id = ' + product_id)
            // redirect to user page
            res.redirect('/products')
        }
    })
})

module.exports = router;