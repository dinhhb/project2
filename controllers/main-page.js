const Dish = require("../models/dish");
const DISHES_PER_PAGE = 9;

exports.getMainPage = (req, res, next) => {
  res.render("main-page/main-page", {
    pageTitle: "Ẩm thực việt",
    path: "/",
  });
};

exports.getDishes = (req, res, next) => {
  const page = +req.query.page || 1;
  let totalDishes;
  const filter = req.query.filter || undefined;
  let query = {};

  if (filter && filter !== 'undefined') {
    // console.log(filter);
    query = {type: filter};
  }

  Dish.find(query)
    .countDocuments()
    .then((numDishes) => {
      totalDishes = numDishes;
      return Dish.find(query)
        .skip((page - 1) * DISHES_PER_PAGE)
        .limit(DISHES_PER_PAGE);
    })
    .then((dishes) => {
      // console.log(dishes);
      res.render("main-page/menu", {
        pageTitle: "Ẩm thực việt",
        dishes: dishes,
        hasDishes: dishes.length > 0,
        path: "/menu",
        currentPage: page,
        hasNextPage: DISHES_PER_PAGE * page < totalDishes,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalDishes / DISHES_PER_PAGE),
        filter: filter,
        searchTerm: null
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getDish = (req, res, next) => {
  const dishId = req.params.dishId;
  Dish.findById(dishId).then((dish) => {
    res.render("main-page/dish-detail", {
      // pageTitle: 'Shop',
      dish: dish,
      path: "/dish-detail",
    });
  }).catch((err) => {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);    
  });
};


exports.getFavoriteDish = (req, res, next) => {
  const favoriteDishIds = req.cookies.favoriteDish;
  const page = +req.query.page || 1;
  const filter = req.query.filter || undefined;
  let query = {};

  if (filter && filter !== 'undefined') {
    // console.log(filter);
    query = {type: filter};
  }
  
  Dish.find(query)
    .then((dishes) => {
      const favoriteDishArray = dishes.filter((dish) => {
        return favoriteDishIds.includes(dish._id.toString());
      });

      const totalItems = favoriteDishArray.length;
      const totalPages = Math.ceil(totalItems / DISHES_PER_PAGE);
      const startIndex = (page - 1) * DISHES_PER_PAGE;
      const endIndex = startIndex + DISHES_PER_PAGE;
      const slicedDishes = favoriteDishArray.slice(startIndex, endIndex);

      res.render("main-page/favorite-dish", {
        path: "/favorite-dish",
        dishes: slicedDishes,
        currentPage: page,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: totalPages,
        filter: filter,
        searchTerm: null
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};


exports.postFavoriteDish = async (req, res, next) => {
  try {
    const dishId = req.body.dishId;
    let favoriteDishIds = req.cookies.favoriteDish || [];

    // Kiểm tra nếu favoriteDishIds không phải là một mảng, chuyển đổi thành mảng
    if (!Array.isArray(favoriteDishIds)) {
      favoriteDishIds = [favoriteDishIds];
    }

    if (!favoriteDishIds.includes(dishId)) {
      favoriteDishIds.push(dishId);
    }

    await res.cookie("favoriteDish", favoriteDishIds);
    res.redirect("/favorite-dish");
  } catch (error) {
    const err = new Error(error);
    err.httpStatusCode = 500;
    return next(err);
  }
};

exports.postDeleteFavoriteDish = async (req, res, next) => {
  try {
    const dishId = req.body.dishId;
    let favoriteDishIds = req.cookies.favoriteDish || [];

    // Kiểm tra nếu favoriteDishIds không phải là một mảng, chuyển đổi thành mảng
    if (!Array.isArray(favoriteDishIds)) {
      favoriteDishIds = [favoriteDishIds];
    }

    // Tìm và xóa dishId khỏi mảng favoriteDishIds
    const updatedFavoriteDishIds = favoriteDishIds.filter((id) => id !== dishId);

    await res.cookie("favoriteDish", updatedFavoriteDishIds);
    res.redirect("/favorite-dish");
  } catch (error) {
    const err = new Error(error);
    err.httpStatusCode = 500;
    return next(err);
  }
};

// exports.getClearFavoriteDish = (req, res, next) => {
//   res.clearCookie("favoriteDish");
//   res.redirect("/");
// };

exports.getDishByIngredient = (req, res, next) => {
  const ingredient = req.query.ingredient; // Lấy giá trị của tham số truy vấn "ingredient"

  Dish.find({ ingredients: ingredient })
    .then((dishes) => {
      // Render trang search-result với danh sách món ăn tìm thấy
      res.render("main-page/dish-by-ingredient", {
        dishes: dishes,
        hasDishes: dishes.length > 0,
        ingredient: ingredient,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);    
    });
};

// exports.searchDishes = async (req, res, next) => {
//   try {
//     const searchTerm = req.query.search; // Lấy giá trị từ query string, ví dụ ?searchTerm=keyword
//     // console.log(searchTerm);

//     // Thực hiện truy vấn tìm kiếm trong CSDL sử dụng Mongoose
//     const dishes = await Dish.find({ name: searchTerm });
//     // console.log(dishes);
//     res.render('main-page/menu', { dishes, searchTerm }); // Trả về kết quả tìm kiếm cho client, ví dụ render template 'searchResults' với danh sách dishes và searchTerm
//   } catch (err) {
//     const error = new Error(err);
//     error.httpStatusCode = 500;
//     return next(error);
//   }
// };

exports.searchDishes = (req, res, next) => {
  const page = +req.query.page || 1;
  let totalDishes;
  const filter = req.query.filter || undefined;
  const searchTerm = req.query.search;
  const searchRegex = new RegExp(searchTerm, 'i'); 
  let query = {name: searchRegex};

  if (filter && filter !== 'undefined') {
    // console.log(filter);
    query = {type: filter, name: searchRegex};
  }

  Dish.find(query)
    .countDocuments()
    .then((numDishes) => {
      totalDishes = numDishes;
      return Dish.find(query)
        .skip((page - 1) * DISHES_PER_PAGE)
        .limit(DISHES_PER_PAGE);
    })
    .then((dishes) => {
      // console.log(dishes);
      res.render("main-page/menu", {
        pageTitle: "Ẩm thực việt",
        dishes: dishes,
        hasDishes: dishes.length > 0,
        path: "/menu-search",
        currentPage: page,
        hasNextPage: DISHES_PER_PAGE * page < totalDishes,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalDishes / DISHES_PER_PAGE),
        filter: filter,
        searchTerm: searchTerm
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};