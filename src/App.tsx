/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  UploadMetadata,
  listAll,
  deleteObject,
  getMetadata,
} from "firebase/storage";
import { storage } from "./firebase";

const UploadImage = () => {
  const [addNewProduct, setAddNewProduct] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [expiry, setExpiry] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [category, setCategory] = useState<string>("Mantimentos");
  const [loading, setLoading] = useState(false);
  const [categories] = useState<string[]>(["Mantimentos", "Comprar", "Acabou"]);
  const [images, setImages] = useState<
    Array<{ url: string; fullPath: string; metadata: any }>
  >([]);
  const [detailsVisibility, setDetailsVisibility] = useState<{
    [key: number]: boolean;
  }>({});

  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchImages();
  }, [category]);

  const fetchImages = async () => {
    const listRef = ref(storage, `images/${category}/`);
    const res = await listAll(listRef);
    const imageUrls = await Promise.all(
      res.items.map(async (itemRef) => {
        const url = await getDownloadURL(itemRef);
        const metadata = await getMetadata(itemRef);
        return {
          url,
          fullPath: itemRef.fullPath,
          metadata: metadata.customMetadata,
        };
      })
    );
    setImages(imageUrls);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      setFile(files[0]);
    }
  };

  const handleUpload = async () => {
    setLoading(true);
    if (file && title) {
      const storageRef = ref(
        storage,
        `images/${category}/${title}-${Date.now()}`
      );
      const metadata: UploadMetadata = {
        customMetadata: {
          title: title,
          description: description,
          expiry: expiry,
          quantity: quantity.toString(),
          category: category,
        },
      };
      await uploadBytes(storageRef, file, metadata);
      await fetchImages();
      setLoading(false);
      setAddNewProduct(false);
      // Limpar campos após o upload
      setFile(null);
      setTitle("");
      setDescription("");
      setExpiry("");
      setQuantity(1);
    }
  };

  const formatDate = (isoString: string) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleDelete = async (fullPath: string) => {
    const confirmDelete = window.confirm(
      "Tem certeza que deseja remover este item?"
    );
    if (confirmDelete) {
      const refToDelete = ref(storage, fullPath);
      await deleteObject(refToDelete);
      await fetchImages();
    }
  };

  const filteredImages = images.filter((image) =>
    image.metadata.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleDetails = (index: number) => {
    setDetailsVisibility((prevState) => ({
      ...prevState,
      [index]: !prevState[index],
    }));
  };

  const getExpiryClass = (expiryDate: string) => {
    const today = new Date();
    const oneMonthLater = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      today.getDate()
    );
    const expiry = new Date(expiryDate);

    if (expiry < today) {
      return "text-red-500"; // Vermelho para itens vencidos
    } else if (expiry <= oneMonthLater) {
      return "text-orange-500"; // Laranjado para itens próximos do vencimento
    }
    return "text-black"; // Preto para itens longe do vencimento
  };

  const getExpiredItems = () => {
    const today = new Date();
    return images
      .filter((image) => new Date(image.metadata.expiry) < today)
      .map((image) => image.metadata.title)
      .join(", ");
  };

  const getItemsAboutToExpire = () => {
    const today = new Date();
    const oneMonthLater = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      today.getDate()
    );
    return images
      .filter((image) => {
        const expiryDate = new Date(image.metadata.expiry);
        return expiryDate >= today && expiryDate <= oneMonthLater;
      })
      .map((image) => image.metadata.title)
      .join(", ");
  };

  // const addCategory = () => {
  //   if (newCategory && !categories.includes(newCategory)) {
  //     setCategories([...categories, newCategory]);
  //     setCategory(newCategory);
  //     setNewCategory("");
  //   }
  // };

  return (
    <div className="p-4">
      {addNewProduct ? (
        <div className="flex items-center flex-col gap-4 justify-center bg-black/5 p-2 rounded-md">
          <label className="w-full">
            <h1>Titulo</h1>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Titulo"
              className="bg-black/5 rounded-md p-2 w-full"
            />
          </label>
          <div className="flex items-center justify-center gap-4 w-full">
            <label className="w-full">
              <h1>Validade</h1>
              <input
                type="date"
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
                className="bg-black/5 rounded-md p-2 w-full"
              />
            </label>
            <div>
              <h1>Quantidade</h1>
              <div className="flex items-center gap-2 w-full">
                <button
                  type="button"
                  className="bg-gray-300 text-black rounded-md px-4 py-2"
                  onClick={() =>
                    setQuantity((prev) => {
                      if (Math.max(0, prev - 1) === 0) {
                        return 1;
                      } else {
                        return Math.max(0, prev - 1);
                      }
                    })
                  }
                >
                  -
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  onFocus={(e) => e.target.select()}
                  className="bg-black/5 rounded-md p-2 w-full text-center"
                  min="1"
                />
                <button
                  type="button"
                  className="bg-gray-300 text-black rounded-md px-4 py-2"
                  onClick={() => setQuantity((prev) => prev + 1)}
                >
                  +
                </button>
              </div>
            </div>
          </div>

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descrição"
            className="w-full p-4 bg-black/5 rounded-md"
          />

          <select
            className="bg-black/5 rounded-md p-2 w-full"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          {/* <input
   type="text"
   value={newCategory}
   onChange={(e) => setNewCategory(e.target.value)}
   placeholder="Criar nova categoria"
   className="bg-black/5 rounded-md p-2 w-full"
 /> */}
          {/* <button onClick={addCategory}>Adicionar Categoria nova</button> */}
          <input type="file" onChange={handleFileChange} />
          <button
            disabled={loading}
            className="bg-indigo-600 disabled:opacity-20 text-white w-full rounded-md py-2 px-4"
            onClick={handleUpload}
          >
            {loading ? "Cadastrando..." : "Cadastrar"}
          </button>
          <button
            disabled={loading}
            className="bg-indigo-600/50 disabled:opacity-20 text-white w-full rounded-md py-2 px-4"
            onClick={() => setAddNewProduct(!addNewProduct)}
          >
            Cancelar
          </button>
        </div>
      ) : (
        <button
          className="bg-indigo-600 text-white w-full rounded-md py-2 px-4"
          onClick={() => setAddNewProduct(!addNewProduct)}
        >
          Adicionar novo produto
        </button>
      )}

      <div className="mt-5">
        <h1>Pesquise por Titulo</h1>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Pesquisar por título..."
          className="bg-black/5 rounded-md p-2 w-full mb-4"
        />
      </div>

      {images.length > 0 && (
        <>
          <p className="text-red-500">
            Itens vencidos: {getExpiredItems() || "Nenhum"}
          </p>
          <p className="text-orange-500">
            Itens a vencer: {getItemsAboutToExpire() || "Nenhum"}
          </p>
        </>
      )}

      <div className="grid grid-cols-2 gap-4 w-full items-start justify-start mt-10">
        {filteredImages.map((image, index) => (
          <div
            key={index}
            className="w-full bg-black/10 p-2 flex flex-col gap-3 items-center justify-center rounded-md"
          >
            <img
              src={image.url}
              alt={`Uploaded at ${image.fullPath}`}
              className="rounded-md w-full"
            />
            <p className="line-clamp-1">{image.metadata.title}</p>
            <p
              className={`${getExpiryClass(
                image.metadata.expiry
              )} line-clamp-1`}
            >
              <b>Validade</b>: {formatDate(image.metadata.expiry)}
            </p>
            {detailsVisibility[index] ? (
              <>
                <p>
                  <b>Descrição</b>: {image.metadata.description}
                </p>

                <p>
                  <b>Quantidade</b>: {image.metadata.quantity}
                </p>
                <p>
                  <b>Categoria</b>: {image.metadata.category}
                </p>
                <button
                  className="bg-black text-white w-full rounded-md py-2 px-4"
                  onClick={() => toggleDetails(index)}
                >
                  Fechar detalhes
                </button>
                <button
                  className="bg-red-500 text-white w-full rounded-md py-2 px-4"
                  onClick={() => handleDelete(image.fullPath)}
                >
                  Remover
                </button>
              </>
            ) : (
              <button
                className="bg-black text-white w-full rounded-md py-1 px-4"
                onClick={() => toggleDetails(index)}
              >
                Ver detalhes
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default UploadImage;
