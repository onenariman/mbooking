"use client";

import { useState } from "react";
import { toast } from "sonner";

import InputPhone from "../InputPhone";
import Spinner from "../Spinner";

import { formatNameInput } from "@/src/validators/formatNameInput";
import { useAddClient } from "@/src/hooks/clients.hooks";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

const AddClient = () => {
  const [name, setName] = useState("");
  const [clientPhone, setClientPhone] = useState(""); // 10 цифр

  const { mutate: addClient, isPending } = useAddClient();

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(formatNameInput(e.target.value));
  };

  const handlePhoneChange = (digits: string) => {
    setClientPhone(digits);
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error("Введите имя клиента");
      return;
    }

    if (clientPhone.length !== 10) {
      toast.error("Введите корректный номер телефона");
      return;
    }

    addClient(
      {
        name: name.trim(),
        phone: `7${clientPhone}`, // ✅ формат для БД
      },
      {
        onSuccess: (data) => {
          setName("");
          setClientPhone("");

          toast("Клиент добавлен", {
            description: `${data.name}, ${data.phone}`,
          });
        },
        onError: (error) => {
          toast.error("Клиент не добавлен", {
            description: `Проверьте соединение с интернетом: ${error.message}`,
          });
        },
      },
    );
  };

  // const isFormInvalid = !name.trim() || clientPhone.length !== 10 || isPending;

  return (
    <Card>
      <CardHeader className="flex flex-col gap-y-1">
        <CardTitle>Добавить клиента</CardTitle>
        <CardDescription>Введите имя и номер телефона клиента</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-y-3">
        <Input
          placeholder="Введите имя клиента"
          value={name}
          onChange={handleNameChange}
          suppressHydrationWarning
        />
        <InputPhone value={clientPhone} onChange={handlePhoneChange} />
        <Button
          type="button"
          onClick={handleSubmit}
          // disabled={isFormInvalid}
          variant="default"
        >
          {isPending ? <Spinner>Добавляем</Spinner> : "Добавить"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default AddClient;
