#!/bin/bash

function createHospital1() {
  infoln "Enrolling the CA admin"
  mkdir -p organizations/peerOrganizations/hospital1.project.com/

  export FABRIC_CA_CLIENT_HOME=${PWD}/organizations/peerOrganizations/hospital1.project.com/

  set -x
  fabric-ca-client enroll -u https://hospital1admin:hospital1adminpw@localhost:7054 --caname ca-hospital1 --tls.certfiles "${PWD}/organizations/fabric-ca/hospital1/tls-cert.pem"
  { set +x; } 2>/dev/null

  echo 'NodeOUs:
  Enable: true
  ClientOUIdentifier:
    Certificate: cacerts/localhost-7054-ca-hospital1.pem
    OrganizationalUnitIdentifier: client
  PeerOUIdentifier:
    Certificate: cacerts/localhost-7054-ca-hospital1.pem
    OrganizationalUnitIdentifier: peer
  AdminOUIdentifier:
    Certificate: cacerts/localhost-7054-ca-hospital1.pem
    OrganizationalUnitIdentifier: admin
  OrdererOUIdentifier:
    Certificate: cacerts/localhost-7054-ca-hospital1.pem
    OrganizationalUnitIdentifier: orderer' > "${PWD}/organizations/peerOrganizations/hospital1.project.com/msp/config.yaml"

  infoln "Registering peer0"
  set -x
  fabric-ca-client register --caname ca-hospital1 --id.name peer0 --id.secret peer0pw --id.type peer --tls.certfiles "${PWD}/organizations/fabric-ca/hospital1/tls-cert.pem"
  { set +x; } 2>/dev/null

  infoln "Registering user"
  set -x
  fabric-ca-client register --caname ca-hospital1 --id.name user1 --id.secret user1pw --id.type client --tls.certfiles "${PWD}/organizations/fabric-ca/hospital1/tls-cert.pem"
  { set +x; } 2>/dev/null

  infoln "Registering the org admin"
  set -x
  fabric-ca-client register --caname ca-hospital1 --id.name hosp1admin --id.secret hosp1adminpw --id.type admin --tls.certfiles "${PWD}/organizations/fabric-ca/hospital1/tls-cert.pem"
  { set +x; } 2>/dev/null

  infoln "Generating the peer0 msp"
  set -x
  fabric-ca-client enroll -u https://peer0:peer0pw@localhost:7054 --caname ca-hospital1 -M "${PWD}/organizations/peerOrganizations/hospital1.project.com/peers/peer0.hospital1.project.com/msp" --csr.hosts peer0.hospital1.project.com --tls.certfiles "${PWD}/organizations/fabric-ca/hospital1/tls-cert.pem"
  { set +x; } 2>/dev/null

  cp "${PWD}/organizations/peerOrganizations/hospital1.project.com/msp/config.yaml" "${PWD}/organizations/peerOrganizations/hospital1.project.com/peers/peer0.hospital1.project.com/msp/config.yaml"

  infoln "Generating the peer0-tls certificates"
  set -x
  fabric-ca-client enroll -u https://peer0:peer0pw@localhost:7054 --caname ca-hospital1 -M "${PWD}/organizations/peerOrganizations/hospital1.project.com/peers/peer0.hospital1.project.com/tls" --enrollment.profile tls --csr.hosts peer0.hospital1.project.com --csr.hosts localhost --tls.certfiles "${PWD}/organizations/fabric-ca/hospital1/tls-cert.pem"
  { set +x; } 2>/dev/null

  cp "${PWD}/organizations/peerOrganizations/hospital1.project.com/peers/peer0.hospital1.project.com/tls/tlscacerts/"* "${PWD}/organizations/peerOrganizations/hospital1.project.com/peers/peer0.hospital1.project.com/tls/ca.crt"
  cp "${PWD}/organizations/peerOrganizations/hospital1.project.com/peers/peer0.hospital1.project.com/tls/signcerts/"* "${PWD}/organizations/peerOrganizations/hospital1.project.com/peers/peer0.hospital1.project.com/tls/server.crt"
  cp "${PWD}/organizations/peerOrganizations/hospital1.project.com/peers/peer0.hospital1.project.com/tls/keystore/"* "${PWD}/organizations/peerOrganizations/hospital1.project.com/peers/peer0.hospital1.project.com/tls/server.key"

  mkdir -p "${PWD}/organizations/peerOrganizations/hospital1.project.com/msp/tlscacerts"
  cp "${PWD}/organizations/peerOrganizations/hospital1.project.com/peers/peer0.hospital1.project.com/tls/tlscacerts/"* "${PWD}/organizations/peerOrganizations/hospital1.project.com/msp/tlscacerts/ca.crt"

  mkdir -p "${PWD}/organizations/peerOrganizations/hospital1.project.com/tlsca"
  cp "${PWD}/organizations/peerOrganizations/hospital1.project.com/peers/peer0.hospital1.project.com/tls/tlscacerts/"* "${PWD}/organizations/peerOrganizations/hospital1.project.com/tlsca/tlsca.hospital1.project.com-cert.pem"

  mkdir -p "${PWD}/organizations/peerOrganizations/hospital1.project.com/ca"
  cp "${PWD}/organizations/peerOrganizations/hospital1.project.com/peers/peer0.hospital1.project.com/msp/cacerts/"* "${PWD}/organizations/peerOrganizations/hospital1.project.com/ca/ca.hospital1.project.com-cert.pem"

  infoln "Generating the user msp"
  set -x
  fabric-ca-client enroll -u https://user1:user1pw@localhost:7054 --caname ca-hospital1 -M "${PWD}/organizations/peerOrganizations/hospital1.project.com/users/User1@hospital1.project.com/msp" --tls.certfiles "${PWD}/organizations/fabric-ca/hospital1/tls-cert.pem"
  { set +x; } 2>/dev/null

  cp "${PWD}/organizations/peerOrganizations/hospital1.project.com/msp/config.yaml" "${PWD}/organizations/peerOrganizations/hospital1.project.com/users/User1@hospital1.project.com/msp/config.yaml"

  infoln "Generating the org admin msp"
  set -x
  fabric-ca-client enroll -u https://hosp1admin:hosp1adminpw@localhost:7054 --caname ca-hospital1 -M "${PWD}/organizations/peerOrganizations/hospital1.project.com/users/Admin@hospital1.project.com/msp" --tls.certfiles "${PWD}/organizations/fabric-ca/hospital1/tls-cert.pem"
  { set +x; } 2>/dev/null

  cp "${PWD}/organizations/peerOrganizations/hospital1.project.com/msp/config.yaml" "${PWD}/organizations/peerOrganizations/hospital1.project.com/users/Admin@hospital1.project.com/msp/config.yaml"
}

function createHospital2() {
  infoln "Enrolling the CA admin"
  mkdir -p organizations/peerOrganizations/hospital2.project.com/

  export FABRIC_CA_CLIENT_HOME=${PWD}/organizations/peerOrganizations/hospital2.project.com/

  set -x
  fabric-ca-client enroll -u https://hospital2admin:hospital2adminpw@localhost:8054 --caname ca-hospital2 --tls.certfiles "${PWD}/organizations/fabric-ca/hospital2/tls-cert.pem"
  { set +x; } 2>/dev/null

  echo 'NodeOUs:
  Enable: true
  ClientOUIdentifier:
    Certificate: cacerts/localhost-8054-ca-hospital2.pem
    OrganizationalUnitIdentifier: client
  PeerOUIdentifier:
    Certificate: cacerts/localhost-8054-ca-hospital2.pem
    OrganizationalUnitIdentifier: peer
  AdminOUIdentifier:
    Certificate: cacerts/localhost-8054-ca-hospital2.pem
    OrganizationalUnitIdentifier: admin
  OrdererOUIdentifier:
    Certificate: cacerts/localhost-8054-ca-hospital2.pem
    OrganizationalUnitIdentifier: orderer' > "${PWD}/organizations/peerOrganizations/hospital2.project.com/msp/config.yaml"

  infoln "Registering peer0"
  set -x
  fabric-ca-client register --caname ca-hospital2 --id.name peer0 --id.secret peer0pw --id.type peer --tls.certfiles "${PWD}/organizations/fabric-ca/hospital2/tls-cert.pem"
  { set +x; } 2>/dev/null

  infoln "Registering user"
  set -x
  fabric-ca-client register --caname ca-hospital2 --id.name user1 --id.secret user1pw --id.type client --tls.certfiles "${PWD}/organizations/fabric-ca/hospital2/tls-cert.pem"
  { set +x; } 2>/dev/null

  infoln "Registering the org admin"
  set -x
  fabric-ca-client register --caname ca-hospital2 --id.name hosp2admin --id.secret hosp2adminpw --id.type admin --tls.certfiles "${PWD}/organizations/fabric-ca/hospital2/tls-cert.pem"
  { set +x; } 2>/dev/null

  infoln "Generating the peer0 msp"
  set -x
  fabric-ca-client enroll -u https://peer0:peer0pw@localhost:8054 --caname ca-hospital2 -M "${PWD}/organizations/peerOrganizations/hospital2.project.com/peers/peer0.hospital2.project.com/msp" --csr.hosts peer0.hospital2.project.com --tls.certfiles "${PWD}/organizations/fabric-ca/hospital2/tls-cert.pem"
  { set +x; } 2>/dev/null

  cp "${PWD}/organizations/peerOrganizations/hospital2.project.com/msp/config.yaml" "${PWD}/organizations/peerOrganizations/hospital2.project.com/peers/peer0.hospital2.project.com/msp/config.yaml"

  infoln "Generating the peer0-tls certificates"
  set -x
  fabric-ca-client enroll -u https://peer0:peer0pw@localhost:8054 --caname ca-hospital2 -M "${PWD}/organizations/peerOrganizations/hospital2.project.com/peers/peer0.hospital2.project.com/tls" --enrollment.profile tls --csr.hosts peer0.hospital2.project.com --csr.hosts localhost --tls.certfiles "${PWD}/organizations/fabric-ca/hospital2/tls-cert.pem"
  { set +x; } 2>/dev/null

  cp "${PWD}/organizations/peerOrganizations/hospital2.project.com/peers/peer0.hospital2.project.com/tls/tlscacerts/"* "${PWD}/organizations/peerOrganizations/hospital2.project.com/peers/peer0.hospital2.project.com/tls/ca.crt"
  cp "${PWD}/organizations/peerOrganizations/hospital2.project.com/peers/peer0.hospital2.project.com/tls/signcerts/"* "${PWD}/organizations/peerOrganizations/hospital2.project.com/peers/peer0.hospital2.project.com/tls/server.crt"
  cp "${PWD}/organizations/peerOrganizations/hospital2.project.com/peers/peer0.hospital2.project.com/tls/keystore/"* "${PWD}/organizations/peerOrganizations/hospital2.project.com/peers/peer0.hospital2.project.com/tls/server.key"

  mkdir -p "${PWD}/organizations/peerOrganizations/hospital2.project.com/msp/tlscacerts"
  cp "${PWD}/organizations/peerOrganizations/hospital2.project.com/peers/peer0.hospital2.project.com/tls/tlscacerts/"* "${PWD}/organizations/peerOrganizations/hospital2.project.com/msp/tlscacerts/ca.crt"

  mkdir -p "${PWD}/organizations/peerOrganizations/hospital2.project.com/tlsca"
  cp "${PWD}/organizations/peerOrganizations/hospital2.project.com/peers/peer0.hospital2.project.com/tls/tlscacerts/"* "${PWD}/organizations/peerOrganizations/hospital2.project.com/tlsca/tlsca.hospital2.project.com-cert.pem"

  mkdir -p "${PWD}/organizations/peerOrganizations/hospital2.project.com/ca"
  cp "${PWD}/organizations/peerOrganizations/hospital2.project.com/peers/peer0.hospital2.project.com/msp/cacerts/"* "${PWD}/organizations/peerOrganizations/hospital2.project.com/ca/ca.hospital2.project.com-cert.pem"

  infoln "Generating the user msp"
  set -x
  fabric-ca-client enroll -u https://user1:user1pw@localhost:8054 --caname ca-hospital2 -M "${PWD}/organizations/peerOrganizations/hospital2.project.com/users/User1@hospital2.project.com/msp" --tls.certfiles "${PWD}/organizations/fabric-ca/hospital2/tls-cert.pem"
  { set +x; } 2>/dev/null

  cp "${PWD}/organizations/peerOrganizations/hospital2.project.com/msp/config.yaml" "${PWD}/organizations/peerOrganizations/hospital2.project.com/users/User1@hospital2.project.com/msp/config.yaml"

  infoln "Generating the org admin msp"
  set -x
  fabric-ca-client enroll -u https://hosp2admin:hosp2adminpw@localhost:8054 --caname ca-hospital2 -M "${PWD}/organizations/peerOrganizations/hospital2.project.com/users/Admin@hospital2.project.com/msp" --tls.certfiles "${PWD}/organizations/fabric-ca/hospital2/tls-cert.pem"
  { set +x; } 2>/dev/null

  cp "${PWD}/organizations/peerOrganizations/hospital2.project.com/msp/config.yaml" "${PWD}/organizations/peerOrganizations/hospital2.project.com/users/Admin@hospital2.project.com/msp/config.yaml"
}

function createOrderer() {
  infoln "Enrolling the CA admin"
  mkdir -p organizations/ordererOrganizations/project.com

  export FABRIC_CA_CLIENT_HOME=${PWD}/organizations/ordererOrganizations/project.com

  set -x
  fabric-ca-client enroll -u https://ordereradmin:ordereradminpw@localhost:9054 --caname ca-orderer --tls.certfiles "${PWD}/organizations/fabric-ca/ordererOrg/tls-cert.pem"
  { set +x; } 2>/dev/null

  echo 'NodeOUs:
  Enable: true
  ClientOUIdentifier:
    Certificate: cacerts/localhost-9054-ca-orderer.pem
    OrganizationalUnitIdentifier: client
  PeerOUIdentifier:
    Certificate: cacerts/localhost-9054-ca-orderer.pem
    OrganizationalUnitIdentifier: peer
  AdminOUIdentifier:
    Certificate: cacerts/localhost-9054-ca-orderer.pem
    OrganizationalUnitIdentifier: admin
  OrdererOUIdentifier:
    Certificate: cacerts/localhost-9054-ca-orderer.pem
    OrganizationalUnitIdentifier: orderer' > "${PWD}/organizations/ordererOrganizations/project.com/msp/config.yaml"

  infoln "Registering orderer"
  set -x
  fabric-ca-client register --caname ca-orderer --id.name orderer --id.secret ordererpw --id.type orderer --tls.certfiles "${PWD}/organizations/fabric-ca/ordererOrg/tls-cert.pem"
  { set +x; } 2>/dev/null

  infoln "Registering the orderer admin"
  set -x
  fabric-ca-client register --caname ca-orderer --id.name ordererAdmin --id.secret ordererAdminpw --id.type admin --tls.certfiles "${PWD}/organizations/fabric-ca/ordererOrg/tls-cert.pem"
  { set +x; } 2>/dev/null

  infoln "Generating the orderer msp"
  set -x
  fabric-ca-client enroll -u https://orderer:ordererpw@localhost:9054 --caname ca-orderer -M "${PWD}/organizations/ordererOrganizations/project.com/orderers/orderer.project.com/msp" --csr.hosts orderer.project.com --csr.hosts localhost --tls.certfiles "${PWD}/organizations/fabric-ca/ordererOrg/tls-cert.pem"
  { set +x; } 2>/dev/null

  cp "${PWD}/organizations/ordererOrganizations/project.com/msp/config.yaml" "${PWD}/organizations/ordererOrganizations/project.com/orderers/orderer.project.com/msp/config.yaml"

  infoln "Generating the orderer-tls certificates"
  set -x
  fabric-ca-client enroll -u https://orderer:ordererpw@localhost:9054 --caname ca-orderer -M "${PWD}/organizations/ordererOrganizations/project.com/orderers/orderer.project.com/tls" --enrollment.profile tls --csr.hosts orderer.project.com --csr.hosts localhost --tls.certfiles "${PWD}/organizations/fabric-ca/ordererOrg/tls-cert.pem"
  { set +x; } 2>/dev/null

  cp "${PWD}/organizations/ordererOrganizations/project.com/orderers/orderer.project.com/tls/tlscacerts/"* "${PWD}/organizations/ordererOrganizations/project.com/orderers/orderer.project.com/tls/ca.crt"
  cp "${PWD}/organizations/ordererOrganizations/project.com/orderers/orderer.project.com/tls/signcerts/"* "${PWD}/organizations/ordererOrganizations/project.com/orderers/orderer.project.com/tls/server.crt"
  cp "${PWD}/organizations/ordererOrganizations/project.com/orderers/orderer.project.com/tls/keystore/"* "${PWD}/organizations/ordererOrganizations/project.com/orderers/orderer.project.com/tls/server.key"

  mkdir -p "${PWD}/organizations/ordererOrganizations/project.com/orderers/orderer.project.com/msp/tlscacerts"
  cp "${PWD}/organizations/ordererOrganizations/project.com/orderers/orderer.project.com/tls/tlscacerts/"* "${PWD}/organizations/ordererOrganizations/project.com/orderers/orderer.project.com/msp/tlscacerts/tlsca.project.com-cert.pem"

  mkdir -p "${PWD}/organizations/ordererOrganizations/project.com/msp/tlscacerts"
  cp "${PWD}/organizations/ordererOrganizations/project.com/orderers/orderer.project.com/tls/tlscacerts/"* "${PWD}/organizations/ordererOrganizations/project.com/msp/tlscacerts/tlsca.project.com-cert.pem"

  infoln "Generating the admin msp"
  set -x
  fabric-ca-client enroll -u https://ordererAdmin:ordererAdminpw@localhost:9054 --caname ca-orderer -M "${PWD}/organizations/ordererOrganizations/project.com/users/Admin@project.com/msp" --tls.certfiles "${PWD}/organizations/fabric-ca/ordererOrg/tls-cert.pem"
  { set +x; } 2>/dev/null

  cp "${PWD}/organizations/ordererOrganizations/project.com/msp/config.yaml" "${PWD}/organizations/ordererOrganizations/project.com/users/Admin@project.com/msp/config.yaml"
}
