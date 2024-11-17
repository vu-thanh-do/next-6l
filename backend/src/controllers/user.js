import mongoose from "mongoose";
import User from "../models/user.js";

export const userController = {
  // get all
  getAllUser: async (req, res) => {
    const {
      _sort = "createAt",
      _order = "asc",
      _limit = 10,
      _page = 1,
    } = req.query;
    const options = {
      page: _page,
      limit: _limit,
      sort: {
        [_sort]: _order === "desc" ? -1 : 1,
      },
    };
    try {
      const users = await User.paginate({}, options);
      if (users.length === 0) {
        return res.json({
          message: "Không có user nào",
        });
      }
      users.docs.map((user) => {
        user.password = undefined;
      });
      return res.status(200).json(users);
    } catch (error) {
      return res.status(400).json({
        message: error,
      });
    }
  },
  getUser: async (req, res) => {
    try {
      const user = await User.findById(req.params.id);
      if (!user) {
        return res
          .status(500)
          .json({ message: "Không tìm thấy thông tin người dùng" });
      }
      user.password = undefined;
      return res.status(200).json({
        message: "Lấy thông tin người dùng thành công",
        user,
      });
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Lỗi server", error: error.message });
    }
  },
  // register
  updateUser: async (req, res) => {
    const { name, email, role } = req.body;
    console.log(req.params.id);
    console.log("Request Body:", req.body);
    console.log("Request Params ID:", req.params.id);
    if (!name || !email || !role) {
      return res
        .status(400)
        .json({ message: "Name, email, and role are required." });
    }
    try {
      const result = await User.findByIdAndUpdate(
        req.params.id,
        { name, email, role },
        { new: true, runValidators: true }
      );

      if (!result) {
        return res.status(404).json({ message: "User not found." });
      }

      return res.status(200).json({
        message: "Update success",
        user: result,
      });
    } catch (error) {
      return res.json({ message: error.message });
    }
  },
  updateInfor: async (req, res, next) => {
    try {
      const { id } = req.params;
      const body = req.body;
      let dataAddress = {
        name: body.username,
        userId: body.userId,
        phone: body.phone,
        address: body.address,
        default: true,
        geoLocation: {
          lat: body.geoLocation.lat,
          lng: body.geoLocation.lng,
        },
      };
      const user = await User.findById(id).populate([
        { path: "address", select: "_id phone address default" },
      ]);
      const addressDefault = user.address.filter((item) => {
        if (item.default) {
          return item.address;
        }
      });
      if (!user) {
        return res.status(400).json({ error: "Update error" });
      }
      const slug = slugify(req.body.username, { lower: true });
      const token = generateToken({ id: user?._id, role: user.role });
      const refreshToken = generateRefreshToken({
        id: user?._id,
        role: user.role,
      });

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: false,
        path: "/",
        sameSite: "strict",
      });

      const dataUpdate = {
        ...req.body,
        slug: slug,
        accessToken: token,
        refreshToken,
      };
      delete dataUpdate.address;
      if (addressDefault.length > 0) {
        const address = await Address.findByIdAndUpdate(
          addressDefault[0]._id,
          dataAddress,
          {
            new: true,
          }
        );
        if (!address) {
          return res.status(400).json({ message: "Cập nhật thất bại" });
        }
      } else {
        const address = await Address.create(dataAddress);
        if (!address) {
          return res.status(400).json({ message: "Cập nhật thất bại" });
        }
        await User.findByIdAndUpdate(body.userId, {
          $addToSet: { address: address._id },
        });
      }
      const updateUser = await User.findByIdAndUpdate(id, dataUpdate, {
        new: true,
      }).populate([{ path: "address", select: "-__v -_id -userId" }]);
      if (!updateUser) {
        return res.status(400).json({ message: "Cập nhật thất bại" });
      }
      res.status(200).json({
        message: "Update Success",
        user: {
          _id: updateUser?._id,
          username: updateUser?.username,
          slug: updateUser?.slug,
          account: updateUser?.account,
          address: updateUser.address,
          avatar: updateUser.avatar,
          role: updateUser.role,
          gender: updateUser.gender,
          accessToken: token,
          refreshToken,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  deleteUser: async (req, res) => {
    try {
      const userDelete = await User.findByIdAndDelete(req.params.id);
      res.json({
        message: "User deleted successfully",
        user: userDelete,
      });
    } catch (error) {
      throw new Error(error);
    }
  },
  // update passwword
  updatePassword: async (req, res) => {
    try {
      const { _id } = req.user;
      const { password, passwordNew } = req.body;
      const findUser = await User.findById(_id);
      if (!findUser) {
        return res.status(404).json({ message: "Người dùng không tồn tại" });
      }
      const isPasswordValid = await bcrypt.compare(password, findUser.password);

      if (!isPasswordValid) {
        return res.status(400).json({ message: "Mật khẩu cũ không đúng" });
      }

      if (findUser && bcrypt.compare(password, findUser.password)) {
        const hashedPassword = await bcrypt.hash(passwordNew, 10);
        findUser.password = hashedPassword;
        await findUser.save();
        return res.json({
          message: "Cập nhật mật khẩu thành công!",
        });
      }
      // return res.status(400).json({ message: 'Password cũ nhập vào không đúng' });
    } catch (error) {
      res.json({ message: error });
    }
  },

  changeRoleUser: async (req, res, next) => {
    try {
      const { id, role } = req.params;
      const user = await User.findById(id);
      await user.updateOne({ role: role });

      if (!user || !role) {
        return res.status(404).send({
          message: "fail",
          err: "Change Role Failed",
        });
      }
      return res.status(200).send({
        message: "success",
        data: user,
      });
    } catch (error) {
      next(error);
    }
  },

  isActiveUser: async (req, res) => {
    try {
      const { idUser } = req.params;

      const newRole = await User.findOneAndUpdate(
        { _id: idUser },
        { status: req.body.status },
        { new: true }
      );

      if (!idUser || !req.body.status) {
        return res.status(400).send({
          message: "fail",
          err: "Change Status account Failed",
        });
      }
      newRole.password = undefined;
      return res.status(200).send({
        message: "success",
        data: newRole,
      });
    } catch (error) {
      return res.status(400).send({
        message: "fail",
        err: `Change Status account Failed: ${error}`,
      });
    }
  },
  // get role user
  getAllRoleUser: async (req, res) => {
    try {
      const { roleName } = req.params;
      if (!roleName) {
        return res
          .status(400)
          .send({ message: "fail", err: "Role name not found" });
      }

      const { _page = 1, _limit = 10, q } = req.query;
      const options = {
        page: _page,
        limit: _limit,
        sort: { createdAt: -1 },
      };

      const userRole = await User.paginate({ role: roleName }, options);

      return res.status(200).send({
        message: "success",
        data: userRole,
      });
    } catch (error) {
      res.status(400).send({
        message: "fail",
        err: `errorl ${error}`,
      });
    }
  },

  /* create user */
  createUser: async (req, res) => {
    try {
      const body = req.body;

      /* validate */
      const { error } = userValidate.validate(body, { abortEarly: false });
      if (error) {
        const errors = error.details.map((error) => error.message);
        return res.status(400).json({
          message: errors,
        });
      }
      /* check account exists */
      const accountExit = await User.findOne({ account: body.account });

      if (accountExit) {
        return res.status(400).json({
          message: "Account đã tồn tại",
        });
      }
      /* check username exists */
      const userNameExits = await User.findOne({ username: body.username });
      if (userNameExits) {
        return res.status(400).json({
          message: "Username đã tồn tại",
        });
      }

      /* check account exists */
      const hashedPassword = await bcrypt.hash(req.body.password, 10);

      const user = await User.create({
        ...req.body,
        password: hashedPassword,
        avatar: body.avatar
          ? body.avatar
          : `https://ui-avatars.com/api/?name=${req.body.username}`,
        gender: body.gender,
      });

      return res.status(200).json({
        message: "Created success",
        user: {
          _id: user._id,
          username: user.username,
          avatar: user.avatar,
          gender: user.gender,
        },
      });
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Lỗi server", error: error.message });
    }
  },

  // reset password
  sendMailForgotPassword: async (req, res) => {
    const { email } = req.body;

    try {
      const foundUser = await User.findOne({ account: email });

      if (!foundUser) {
        return res.status(400).json({
          message: "Email does not exists.",
        });
      }
      const token = crypto.randomBytes(32).toString("hex");
      const hashedToken = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

      foundUser.passwordChangedAt = new Date();
      foundUser.passwordResetToken = hashedToken;
      foundUser.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000);
      await foundUser.save();
      const resetURL = `Please follow this link to reset your password. This link is valid still 10 minutes from now. <a href="http://localhost:5173/reset-forgot-password/${token}">Click Here</a>`;

      const data = {
        to: email,
        text: "Hi!",
        subject: "Forgot Password Link",
        html: resetURL,
      };
      await sendEmail(data);
      return res.status(200).json({
        message: "Email reset password sent.",
        data: { token },
      });
    } catch (error) {
      return res.status(400).json({
        message: `Something went wrong! ${error.message || ""}.`,
      });
    }
  },
  resetPassword: async (req, res) => {
    const { password } = req.body;
    const { token } = req.params;
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    try {
      const foundUser = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: new Date() },
      });

      if (!foundUser) {
        return res.status(400).json({
          message: "Token invalid or expired. Please try again.",
        });
      }

      const salt = await bcrypt.genSalt(10);

      const passwordNew = await bcrypt.hash(password, salt);

      foundUser.password = passwordNew;
      foundUser.passwordResetToken = null;
      foundUser.passwordResetExpires = null;

      await foundUser.save();

      return res.status(200).json({
        message: "Reset password successfully.",
        data: {
          user: foundUser,
        },
      });
    } catch (error) {
      return res.status(400).json({
        message: `Something went wrong! ${error.message || ""}`,
      });
    }
  },

  //getAllAdmin,Staff
  getAllAdminAndStaff: async (req, res) => {
    try {
      const listData = await User.find({ role: { $in: ["admin", "staff"] } });
      if (listData.length === 0 || !listData) {
        return res.status(400).json({
          message: "Không có dữ liệu",
        });
      }
      return res.status(200).json({
        message: "Lấy danh sách thành công",
        data: listData,
      });
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  },
};
