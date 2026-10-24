import slugify from "slugify";
import ProductModel from "../models/ProductModel.js";
import fs from "fs";
import categoryModel from '../models/categoryModel.js'
import braintree from "braintree";
import orderModel from "../models/orderModel.js";
import mongoose from "mongoose";

const getBraintreeGateway = () => {
  const { BRAINTREE_MERCHANT_ID, BRAINTREE_PUBLIC_KEY, BRAINTREE_PRIVATE_KEY } =
    process.env;

  if (
    !BRAINTREE_MERCHANT_ID ||
    !BRAINTREE_PUBLIC_KEY ||
    !BRAINTREE_PRIVATE_KEY
  ) {
    throw new Error(
      "Braintree credentials are not configured. Set BRAINTREE_MERCHANT_ID, BRAINTREE_PUBLIC_KEY, and BRAINTREE_PRIVATE_KEY."
    );
  }

  return new braintree.BraintreeGateway({
    environment: braintree.Environment.Sandbox,
    merchantId: BRAINTREE_MERCHANT_ID,
    publicKey: BRAINTREE_PUBLIC_KEY,
    privateKey: BRAINTREE_PRIVATE_KEY,
  });
};

export const createProductController = async (req, res) => {
  try {
    const { name, description, price, category, quantity, shipping } =
      req.fields;
    const { photo } = req.files;
    //validation
    switch (true) {
      case !name:
        return res.status(500).send({
          error: "Name is required",
        });
      case !description:
        return res.status(500).send({
          error: "Description is required",
        });
      case !price:
        return res.status(500).send({
          error: "Price is required",
        });
      case !category:
        return res.status(500).send({
          error: "Category is required",
        });
      case !quantity:
        return res.status(500).send({
          error: "Quantity is required",
        });
      case photo && photo.size > 1000000:
        return res.status(500).send({
          error: "Photo is required and size should be less than 1mb",
        });
    }
    const products = new ProductModel({ ...req.fields, slug: slugify(name) });
    if (photo) {
      products.photo.data = fs.readFileSync(photo.path);
      products.photo.contentType = photo.type;
    }
    await products.save();
    res.status(201).send({
      success: true,
      message: "Product created Successfully",
      products,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error,
      message: "Error in creating product",
    });
  }
};

export const getproductController = async (req, res) => {
  try {
    const products = await ProductModel.find({})
      .select("-photo")
      .limit(12)
      .sort({ createdAt: -1 });
    res.status(200).send({
      success: true,
      totalcount: products.length,
      message: "All products",
      products,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: true,
      error: error.message,
      message: "Error while Fetching products",
    });
  }
};

//single product
export const getsingleproductController = async (req, res) => {
  try {
    const product = await ProductModel.findOne({
      slug: req.params.slug,
    }).select("-photo");
    res.status(200).send({
      success: true,
      message: "Product fetched successfully",
      product,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      messsage: "Error while fetching single product",
      error,
    });
  }
};
//photo controller
export const productPhotoController = async (req, res) => {
  try {
    const product = await ProductModel.findById(req.params.pid).select("photo");
    if (product.photo.data) {
      res.set("Content-type", product.photo.contentType);
      return res.status(200).send(product.photo.data);
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error while fetching photo",
      error,
    });
  }
};

//deleteproduct 
export const deleteProductController = async (req, res) => {
  try {
    await ProductModel.findByIdAndDelete(req.params.pid).select("photo");
    res.status(200).send({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: true,
      error,
      message: "Error while deleting photo",
    });
  }
};

//update Product
export const updateProductController = async (req, res) => {
  try {
    const { name, description, price, category, quantity, shipping } =
      req.fields;
    const { photo } = req.files;
    //validation
    switch (true) {
      case !name:
        return res.status(500).send({
          error: "Name is required",
        });
      case !description:
        return res.status(500).send({
          error: "Description is required",
        });
      case !price:
        return res.status(500).send({
          error: "Price is required",
        });
      case !category:
        return res.status(500).send({
          error: "Category is required",
        });
      case !quantity:
        return res.status(500).send({
          error: "Quantity is required",
        });
      case photo && photo.size > 1000000:
        return res.status(500).send({
          error: "Photo is required and size should be less than 1mb",
        });
    }
    const products = await ProductModel.findByIdAndUpdate(
      req.params.pid,
      { ...req.fields, slug: slugify(name) },
      { new: true }
    );
    if (photo) {
      products.photo.data = fs.readFileSync(photo.path);
      products.photo.contentType = photo.type;
    }
    await products.save();
    res.status(201).send({
      success: true,
      message: "Product Updated Successfully",
      products,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error,
      message: "Error in updating product",
    });
  }
};

//filter

export const productFilterController = async (req, res) => {
  try {
    const { checked, radio } = req.body;
    let args = {};
    if (checked.length > 0) args.category = checked;
    if (radio.length) args.price = { $gte: radio[0], $lte: radio[1] };
    const products = await ProductModel.find(args);
    res.status(200).send({
      success: true,
      products,
    });
  } catch (error) {
    console.log(error);
    res.status(400).send({
      success: false,
      message: "Error While Filtering Products",
      error,
    });
  }
};
export const productCountController = async (req, res) => {
  try {
    const total = await ProductModel.find({}).estimatedDocumentCount();
    res.status(200).send({
      success: true,
      total,
    });
  } catch (error) {
    console.log(error);
    res.status(400).send({
      success: false,
      message: "Error in product count",
      error,
    });
  }
};
//product list based on page
export const productListController = async (req, res) => {
  try {
    const perPage = 4;
    const page = req.params.page ? req.params.page : 1;
    const products = await ProductModel.find({})
      .select("-photo")
      .skip((page - 1) * perPage)
      .sort({ createdAt: -1 });
      res.status(200).send({
        success:true,
        products,
      })
  } catch (error) {
    console.log(error);
    res.status(400).send({
      success: false,
      message: "Error in per page control",
    });
  }
};

//search product
export const searchProductController=async(req,res)=>{
  try {
    const {keyword}=req.params;
    const result=await ProductModel.find({
      $or:[
        {name:{$regex:keyword, $options:'i'}},
        {description:{$regex:keyword, $options:'i'}}
      ],
    }).select('-photo');
    res.json(result);
  } catch (error) {
    console.log(error)
    res.status(400).send({
      success:false,
      message:"Error In Search Product API",
      error,
    });

  }
}
//related
export const relatedProductController = async (req, res) => {
  try {
    const { pid, cid } = req.params;

    // Check if cid is undefined or missing and handle it appropriately.
    if (typeof cid === 'undefined') {
      return res.status(400).send({ 
        success: false,
        error: 'Category ID (cid) is missing in the request.',
      });
    } 

    const products = await ProductModel.find({
      category: cid,
      _id: { $ne: pid },
    }).select('-photo').limit(3).populate('category')

    res.status(200).send({
      success: true,
      products,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      success: false,
      error: 'Internal Server Error',
    });
  }
};
export const productCategoryController=async(req,res)=>{
  try {
    const category =await categoryModel.findOne({slug:req.params.slug})
    const product =await ProductModel.find({category})
    res.status(200).send({
      success:true,
      category,
      product,
    });
  } catch (error) {
    console.log(error)
    res.status(400).send({
      sucess:false,
      error,
      message:"Error while getting category products"
    })
  }
}

//payment gateway api
export const braintreeTokenController=async(req,res)=>{
    try {
      getBraintreeGateway().clientToken.generate({},function(err,response){
        if(err){
          return res.status(500).send(err)
        }
        else{
          res.send(response)
        }
      })
    } catch (error) {
      console.log(error)
      res.status(500).send({ message: "Payment gateway is not configured" })
    } 
}

//payment
export const braintreePaymentsController=async(req,res)=>{
  try {
    const { cart, nonce } = req.body;
    if (!Array.isArray(cart) || cart.length === 0 || !nonce) {
      return res.status(400).send({
        success: false,
        message: "Cart and payment nonce are required",
      });
    }

    const requestedItems = cart.map((item) => ({
      id: item?._id || item?.id,
      quantity: Number(item?.quantity ?? 1),
    }));
    if (
      requestedItems.some(
        (item) =>
          !item.id ||
          !mongoose.isValidObjectId(item.id) ||
          !Number.isInteger(item.quantity) ||
          item.quantity < 1
      )
    ) {
      return res.status(400).send({
        success: false,
        message: "Each cart item must include a valid product ID and quantity",
      });
    }

    const productIds = requestedItems.map((item) => item.id);
    const products = await ProductModel.find({ _id: { $in: productIds } }).select(
      "_id price quantity"
    );
    const productsById = new Map(
      products.map((product) => [product._id.toString(), product])
    );
    let total = 0;
    for (const item of requestedItems) {
      const product = productsById.get(item.id.toString());
      if (!product) {
        return res.status(400).send({
          success: false,
          message: "One or more products are no longer available",
        });
      }
      if (item.quantity > product.quantity) {
        return res.status(400).send({
          success: false,
          message: `Insufficient inventory for ${product._id}`,
        });
      }
      const price = Number(product.price);
      if (!Number.isFinite(price) || price < 0) {
        return res.status(500).send({
          success: false,
          message: "A product has an invalid price",
        });
      }
      total += price * item.quantity;
    }

    const gateway = getBraintreeGateway();
    gateway.transaction.sale({
      amount: total.toFixed(2),
      paymentMethodNonce:nonce,
      options:{
        submitForSettlement:true
      }
    },
    async function(error,result){
      if(result){
        await new orderModel({
          products: requestedItems.map((item) => item.id),
          payment:result,
          buyer:req.user._id
        }).save()
        return res.json({ok:true})
      }else{
        return res.status(500).send(error)
      }
    }
    
    )
  } catch (error) {
    console.log(error)
    res.status(500).send({
      success: false,
      message: "Error while processing payment",
    })
  }
}