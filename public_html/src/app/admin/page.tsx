"use client";
import React, { useState } from "react";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";

const Admin = () => {
  const [formData, setFormData] = useState({
    title: "",
    image: "",
    detail: "",
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        setFormData({
          ...formData,
          image: reader.result as string, // Lưu base64 của ảnh
        });
      };
      reader.onerror = (error) => console.error("Lỗi đọc file:", error);
    }
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`http://localhost:1968/post-news`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData), // Gửi dữ liệu form
      });
      const result = await response.json();
      console.log("Lưu thành công:", result);
    } catch (error) {
      console.error("Lỗi khi lưu bài viết:", error);
    }
  };

  return (
    <div>
      <h2>Thêm bài viết</h2>

      <div className="mb-4">
        <label htmlFor="title" className="block font-bold mb-1">
          Tiêu đề
        </label>
        <input
          type="text"
          id="title"
          className="w-full border px-3 py-2 rounded-md"
          value={formData.title}
          onChange={(e) =>
            setFormData({ ...formData, title: e.target.value })
          }
          placeholder="Nhập tiêu đề bài viết"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="image" className="block font-bold mb-1">
          Ảnh (base64)
        </label>
        <input
          type="file"
          id="image"
          className="w-full border px-3 py-2 rounded-md"
          accept="image/*"
          onChange={handleImageChange}
        />
        {formData.image && (
          <img
            src={formData.image}
            alt="Preview"
            className="mt-2 w-48 h-48 object-cover border rounded-md"
          />
        )}
      </div>

      <CKEditor
        editor={ClassicEditor}
        data="<p>Viết nội dung tại đây...</p>"
        onReady={(editor) => {
          editor.plugins.get("FileRepository").createUploadAdapter = (loader) => {
            return {
              upload: () =>
                loader.file.then(
                  (file: any) =>
                    new Promise((resolve, reject) => {
                      const reader = new FileReader();
                      reader.readAsDataURL(file); // Chuyển file thành base64
                      reader.onload = () => {
                        resolve({
                          default: reader.result, // Base64 string của ảnh
                        });
                      };
                      reader.onerror = (error) => reject(error);
                    })
                ),
              abort: () => console.log("Hủy tải ảnh."),
            };
          };
        }}
        onChange={(event, editor) => {
          const data = editor.getData();
          setFormData({
            ...formData,
            detail: data,
          }); // Lưu nội dung HTML
        }}
      />

      <button
        className="bg-green-500 text-white font-bold px-3 py-2 rounded-md mt-4"
        onClick={handleSave}
      >
        Lưu bài viết
      </button>
    </div>
  );
};

export default Admin;
