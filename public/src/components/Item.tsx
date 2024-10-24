import { Timestamp } from "firebase/firestore";
import Card from "react-bootstrap/Card";
import { FC } from "react";
import { Notification } from "../models/Models";
import { getPublicUrl } from "../helpers/Firebase";
import Image from "react-bootstrap/Image";

interface ItemProps {
  notification: Notification;
}

const Item: FC<ItemProps> = (props) => {
  return (
    <Card>
      <Card.Header>{props.notification.title}</Card.Header>
      <Card.Body>
        <Card.Title>{props.notification.message}</Card.Title>
        <Card.Subtitle className="mb-2 text-muted">
          <span className="text-muted small">
            {Timestamp.fromMillis(props.notification.time).toDate().toUTCString()}
          </span>
        </Card.Subtitle>
        <Card.Text>
          <Image src={getPublicUrl(props.notification.file ?? "")} rounded />
        </Card.Text>
      </Card.Body>
    </Card>
  );
};

export default Item;
