import { photos } from "@/lib/photos";

/** Single source for the services shown on the Home and Services pages. */
export const services = [
  {
    id: "outpatient",
    name: "Outpatient Care",
    plain: "Consultations",
    img: photos.consultRoom,
    summary: "Consultations with our doctors for check-ups, new concerns and follow-up visits.",
    text: "Our doctors see patients who do not need to stay in hospital. You can come in for a check-up, talk through a health concern or return for a follow-up visit. We listen, explain what we find and agree the next steps with you.",
    forWho: ["General check-ups", "New or ongoing health concerns", "Follow-up visits", "Medical advice for you and your family"],
  },
  {
    id: "maternity",
    name: "Maternity Care",
    plain: "Mothers and babies",
    img: photos.maternityTeam,
    summary: "Care for mothers during pregnancy, delivery and after the birth.",
    text: "We support women through pregnancy, childbirth and the weeks that follow. Our team will explain what to expect at each stage and answer your questions along the way.",
    forWho: ["Antenatal check-ups", "Delivery", "Postnatal care for mother and baby", "Questions about pregnancy"],
  },
  {
    id: "paediatric",
    name: "Paediatric Care",
    plain: "Babies and children",
    img: photos.nursesBaby,
    summary: "Medical care for babies and children, with parents involved at every step.",
    text: "Our paediatric care is for babies and children. We take time to examine each child gently, explain things to parents in plain language and include the family in decisions about their child's care.",
    forWho: ["Illness in babies and children", "Routine child check-ups", "Concerns about growth or development", "Advice for parents"],
  },
  {
    id: "surgery",
    name: "Surgery",
    plain: "Surgical care",
    img: photos.surgeon,
    summary: "Surgical consultation, treatment and follow-up care.",
    text: "Patients who may need surgery are first seen by a doctor, who explains the options and what to expect. After a procedure, we continue with follow-up care until the patient is well.",
    forWho: ["Surgical consultation", "Planned procedures", "Follow-up care after surgery"],
  },
  {
    id: "inpatient",
    name: "Inpatient Care",
    plain: "Hospital stay",
    img: photos.ward,
    summary: "Care for patients who need to stay in hospital.",
    text: "When a patient needs to be admitted, our doctors and nurses look after them during their stay and keep the family informed about their progress.",
    forWho: ["Patients who need to be admitted", "Care from our nursing team", "Regular review by doctors"],
  },
];
