const express = require("express");
const { body, validationResult } = require("express-validator");

const adminController = require("../controllers/admin");

const filterIngredientsAndSteps  = require("../middleware/filterIngredientsAndSteps");

const router = express.Router();

router.get("/dish-management", adminController.getDishManagement);

router.get("/add-dish", adminController.getAddDish);

router.post(
  "/add-dish",
  [
    filterIngredientsAndSteps,
    body("name")
      .trim()
      .notEmpty()
      .withMessage("Tên món ăn không được bỏ trống"),
    body("ingredients")
      .custom((value, { req }) => {
        // console.log("Ingredients:", value); // Debugging statement
        if (!Array.isArray(value) || value.length < 1) {
          throw new Error("Phải có ít nhất 1 nguyên liệu");
        }
        return true;
      }),
    body("steps")
    .custom((value, { req }) => {
      // console.log("Steps:", value); // Debugging statement
      if (!Array.isArray(value) || value.length < 1) {
        throw new Error("Phải có ít nhất 1 bước chế biến");
      }
      return true;
    }),
    body("requirement")
      .trim()
      .notEmpty()
      .withMessage("Yêu cầu cảm quan không được bỏ trống"),
  ],
  adminController.postAddDish
);

router.get("/edit-dish/:dishId", adminController.getEditDish);

router.post(
  "/edit-dish",
  [
    filterIngredientsAndSteps,
    body("name")
      .trim()
      .notEmpty()
      .withMessage("Tên món ăn không được bỏ trống"),
      body("ingredients")
      .custom((value, { req }) => {
        // console.log("Ingredients:", value); // Debugging statement
        if (!Array.isArray(value) || value.length < 1) {
          throw new Error("Phải có ít nhất 1 nguyên liệu");
        }
        return true;
      }),
    body("steps")
    .custom((value, { req }) => {
      // console.log("Steps:", value); // Debugging statement
      if (!Array.isArray(value) || value.length < 1) {
        throw new Error("Phải có ít nhất 1 bước chế biến");
      }
      return true;
    }),
    body("requirement")
      .trim()
      .notEmpty()
      .withMessage("Yêu cầu cảm quan không được bỏ trống"),
  ],
  adminController.postEditDish
);

router.get("/statistic", adminController.getStatistic);

router.delete("/dish/:dishId", adminController.deleteDish);

router.get('/dish-management-search', adminController.searchDishes);

module.exports = router;
