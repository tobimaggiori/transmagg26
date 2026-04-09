VERSION 5.00
Object = "{FF19AA0C-2968-41B8-A906-E80997A9C394}#202.0#0"; "WSAFIPFEOCX.ocx"
Begin VB.Form ConsUltAuto 
   Caption         =   "Consulta de Ultimo Comprobante Autorizado"
   ClientHeight    =   3195
   ClientLeft      =   60
   ClientTop       =   345
   ClientWidth     =   4680
   LinkTopic       =   "Form1"
   MDIChild        =   -1  'True
   ScaleHeight     =   3195
   ScaleWidth      =   4680
   Begin VB.CommandButton GenerarQR 
      Caption         =   "Generar QR"
      Height          =   375
      Left            =   720
      TabIndex        =   7
      Top             =   2640
      Width           =   2895
   End
   Begin VB.TextBox NroFact 
      Height          =   285
      Left            =   2640
      TabIndex        =   6
      Top             =   840
      Width           =   1935
   End
   Begin VB.CommandButton Recupera 
      Caption         =   "Recupera datos AFIP (Comp, Pto de Vta y Nro Comp)"
      Height          =   495
      Left            =   720
      TabIndex        =   5
      Top             =   2040
      Width           =   2895
   End
   Begin WSAFIPFEOCX.WSAFIPFEx FE2 
      Left            =   3840
      Top             =   2280
      _ExtentX        =   1296
      _ExtentY        =   873
   End
   Begin VB.CommandButton Command1 
      Caption         =   "Consulta Último Comprobante Autorizado (Comp y Pto de Vta)"
      Height          =   495
      Left            =   720
      TabIndex        =   4
      Top             =   1440
      Width           =   2895
   End
   Begin VB.TextBox PtoVta 
      Height          =   285
      Left            =   1680
      TabIndex        =   3
      Top             =   840
      Width           =   855
   End
   Begin VB.ComboBox Comp 
      Height          =   315
      Left            =   1680
      TabIndex        =   2
      Top             =   360
      Width           =   2895
   End
   Begin VB.Label Label2 
      Caption         =   "Pto de Vta"
      Height          =   255
      Left            =   240
      TabIndex        =   1
      Top             =   840
      Width           =   1215
   End
   Begin VB.Label Label1 
      Caption         =   "Comprobante"
      Height          =   255
      Left            =   240
      TabIndex        =   0
      Top             =   360
      Width           =   1215
   End
End
Attribute VB_Name = "ConsUltAuto"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Dim tComp As Integer, Ult As String, tCompS As Integer

Private Sub Command1_Click()
If fe2.iniciar(modoFiscal_Fiscal, "30709381683", App.Path + "\Certificado\Certificado.pfx", App.Path + "\Certificado\WSAFIPFE.lic") Then
   fe2.ArchivoCertificadoPassword = "hercasa1509"
   If fe2.f1ObtenerTicketAcceso() Then
        If Comp.ListIndex = 0 Then
            MsgBox "Factura"
            tComp = 1
        ElseIf Comp.ListIndex = 1 Then
            tComp = 3
        ElseIf Comp.ListIndex = 2 Then
            tComp = 2
        Else
            tComp = 60
        End If
        
        Ult = fe2.F1CompUltimoAutorizadoS(PtoVta, tComp)

    
        MsgBox ("El último comprobantes autorizado es el:" + Ult)
    End If
    MsgBox ("El último comprobantes autorizado es el:" + Ult & Fecha)
Else
    MsgBox ("No puede iniciar" + fe2.UltimoMensajeError)
End If
End Sub

Private Sub Form_Load()
Comp.AddItem ("Factura")
Comp.AddItem ("Nota de Crédito")
Comp.AddItem ("Nota de Débito")
Comp.AddItem ("Liquido Producto")


End Sub

Private Sub GenerarQR_Click()
If fe2.iniciar(modoFiscal_Fiscal, "30709381683", App.Path + "\Certificado\Certificado.pfx", App.Path + "\Certificado\WSAFIPFE.lic") Then
    Me.fe2.ArchivoCertificadoPassword = "hercasa1509"
    If fe2.f1ObtenerTicketAcceso() Then
        If Comp.ListIndex = 0 Then
            tComp = 1
            tCompS = 16
        ElseIf Comp.ListIndex = 1 Then
            tComp = 3
            tCompS = 17
        ElseIf Comp.ListIndex = 2 Then
            tComp = 2
            tCompS = 18
        Else
            tComp = 60
            tCompS = 60
        End If
        If tComp = 60 Then
            Set rsEncabComp = db.OpenRecordset("Select * From EncabLProd Where NroComp = " & NroFact & " And PtoVta = " & PtoVta & " And Tiposistema = " & tCompS & "")
            If Not rsEncabComp.EOF Then
                fe2.F1CabeceraCantReg = 1
                fe2.F1CabeceraPtoVta = PtoVta
                fe2.F1CabeceraCbteTipo = tCompS
                fe2.f1Indice = 0
                fe2.qrVersion = 1
                fe2.F1DetalleConcepto = 1
                Set rsEmpresas = db.OpenRecordset("Select * From Fleteros Where CodFlet= " & rsEncabComp!codflet & "")
                fe2.F1DetalleDocTipo = 80
                VCUIT = Mid(rsEmpresas!cuit, 1, 2) & Mid(rsEmpresas!cuit, 4, 8) & Mid(rsEmpresas!cuit, 13, 1)
                fe2.F1DetalleDocNro = VCUIT
                fe2.F1DetalleCbteDesdeS = rsEncabComp!NroComp
                Vfecha = Mid(rsEncabComp!Fecha, 7, 4) & Mid(rsEncabComp!Fecha, 4, 2) & Mid(rsEncabComp!Fecha, 1, 2)
                fe2.F1DetalleCbteFch = Vfecha
                i = Len(rsEncabComp!totalviajeS1)
                For A = i To 1 Step -1
                    DIGITO = Mid(rsEncabComp!totalviajeS1, A, 1)
                    If Not DIGITO = "." Then
                        VTOTAL = DIGITO & VTOTAL
                    End If
                Next
                fe2.F1DetalleImpTotal = VTOTAL
                fe2.F1DetalleMonId = "PES"
                fe2.F1DetalleMonCotiz = 1
                fe2.F1Detalleqrtipocodigo = "E"
                Rem  fe.F1Detalleqrtipocodigo = "A" si es un CAE anticipado
                fe2.F1DetalleCAEA = 1
                fe2.F1DetalleQRArchivo = App.Path + "\QR\qr" & tCompS & "_" & PtoVta & "_" & NroFact & ".jpg"
                fe2.f1detalleqrtolerancia = 1
                fe2.f1detalleqrresolucion = 4
                fe2.f1detalleqrformato = 6
                If fe2.f1qrGenerar(99) Then
                    MsgBox ("gráfico generado con los datos. " + fe2.f1qrmanualTexto)
                    rsEncabComp.Edit
                    rsEncabComp.Fields("QR") = App.Path + "\QR\qr" & tCompS & "_" & PtoVta & "_" & NroFact & ".jpg"
                    rsEncabComp.Update
                Else
                    MsgBox ("error al generar imagen " + fe2.ArchivoQRError + " " + fe2.UltimoMensajeError)
                End If
            Else
                MsgBox "No se genero el comprobante"
            End If
        Else
            Set rsEncabComp = db.OpenRecordset("Select * From EncabFE Where Nrofe = " & NroFact & " And PtoVtaFE = " & PtoVta & " And Tiposistema = " & tCompS & "")
            If Not rsEncabComp.EOF Then
                fe2.F1CabeceraCantReg = 1
                fe2.F1CabeceraPtoVta = PtoVta
                fe2.F1CabeceraCbteTipo = tCompS
                fe2.f1Indice = 0
                fe2.qrVersion = 1
                fe2.F1DetalleConcepto = 1
                Set rsEmpresas = db.OpenRecordset("Select * From Empresas Where CodEmpresas = " & rsEncabComp!CodClie & "")
                fe2.F1DetalleDocTipo = 80
                VCUIT = Mid(rsEmpresas!cuit, 1, 2) & Mid(rsEmpresas!cuit, 4, 8) & Mid(rsEmpresas!cuit, 13, 1)
                fe2.F1DetalleDocNro = VCUIT
                fe2.F1DetalleCbteDesdeS = rsEncabComp!NroFE
                Vfecha = Mid(rsEncabComp!FechaFE, 7, 4) & Mid(rsEncabComp!FechaFE, 4, 2) & Mid(rsEncabComp!FechaFE, 1, 2)
                fe2.F1DetalleCbteFch = Vfecha
                i = Len(rsEncabComp!totalgralfe)
                For A = i To 1 Step -1
                    DIGITO = Mid(rsEncabComp!totalgralfe, A, 1)
                    If Not DIGITO = "." Then
                        VTOTAL = DIGITO & VTOTAL
                    End If
                Next
                fe2.F1DetalleImpTotal = VTOTAL
                fe2.F1DetalleMonId = "PES"
                fe2.F1DetalleMonCotiz = 1
                fe2.F1Detalleqrtipocodigo = "E"
                Rem  fe.F1Detalleqrtipocodigo = "A" si es un CAE anticipado
                fe2.F1DetalleCAEA = 1
                fe2.F1DetalleQRArchivo = "J:\NuevoTransporte\QR\qr" & tCompS & "_" & PtoVta & "_" & NroFact & ".jpg"
                fe2.f1detalleqrtolerancia = 1
                fe2.f1detalleqrresolucion = 4
                fe2.f1detalleqrformato = 6
                If fe2.f1qrGenerar(99) Then
                    MsgBox ("gráfico generado con los datos. " + fe2.f1qrmanualTexto)
                    rsEncabComp.Edit
                    rsEncabComp.Fields("QR") = "J:\NuevoTransporte\QR\qr" & tCompS & "_" & PtoVta & "_" & NroFact & ".jpg"
                    rsEncabComp.Update
                Else
                    MsgBox ("error al generar imagen " + fe2.ArchivoQRError + " " + fe2.UltimoMensajeError)
                End If
            Else
                MsgBox "No se genero el comprobante"
            End If
        End If
    End If
End If
End Sub

Private Sub Recupera_Click()
On Error Resume Next
Dim lreult As Boolean
If fe2.iniciar(modoFiscal_Fiscal, "30709381683", App.Path + "\Certificado\Certificado.pfx", App.Path + "\Certificado\WSAFIPFE.lic") Then
    Me.fe2.ArchivoCertificadoPassword = "hercasa1509"
    If fe2.f1ObtenerTicketAcceso() Then
        If Comp.ListIndex = 0 Then
            tComp = 1
            tCompS = 16
        ElseIf Comp.ListIndex = 1 Then
            tComp = 3
            tCompS = 17
        ElseIf Comp.ListIndex = 2 Then
            tComp = 2
            tCompS = 18
        Else
            tComp = 60
            tCompS = 60
        End If
        lresul = fe2.F1CompConsultar(PtoVta, tComp, NroFact)
        resultado = lresul
        MsgBox resultado
        If lresul = True Then
            If Comp.ListIndex = 0 Or Comp.ListIndex = 1 Or Comp.ListIndex = 2 Then
                
                Set rsEncabFact = db.OpenRecordset("Select * FRom EncabFe Where NroFE = " & NroFact & " And TipoSistema = " & tCompS & "")
                If rsEncabFact!Emp_Flet = 0 Then
                    MsgBox "AcaEmpFle0" & fe2.F1RespuestaDetalleCae
                    VCUIT = Mid(fe2.F1DetalleDocNro, 1, 2) & "-" & Mid(fe2.F1DetalleDocNro, 3, 8) & "-" & Mid(fe2.F1DetalleDocNro, 11, 1)
                    Set rsEmpresas = db.OpenRecordset("Select * From Empresas Where CUIT = '" & VCUIT & "'")
                    Vcodclie = rsEmpresas!codEmpresas
                Else
                    MsgBox "AcaEmpFle1" & fe2.F1RespuestaDetalleCae
                    VCUIT = Mid(fe2.F1DetalleDocNro, 1, 2) & "-" & Mid(fe2.F1DetalleDocNro, 3, 8) & "-" & Mid(fe2.F1DetalleDocNro, 11, 1)
                    Set rsFleteros = db.OpenRecordset("Select * From Fleteros Where CUIT = '" & VCUIT & "'")
                    Vcodclie = rsFleteros!codflet
                End If
    
                If Not rsEncabFact.EOF And Not rsEncabFact.BOF Then
                    MsgBox "Edita"
                    
                    With rsEncabFact
                        .Edit
                        .Fields("Indice") = fe2.f1Indice
                        .Fields("CodClie") = Vcodclie
                        .Fields("FechaFE") = fe2.F1DetalleCbteFch
                        .Fields("TotalNetoFE") = fe2.F1DetalleImpNeto
                        .Fields("TotalIVAFE") = fe2.F1DetalleImpIva
                        .Fields("TotalGralFE") = fe2.F1DetalleImpTotal
                        .Fields("FVto") = fe2.F1DetalleFchVtoPago
                        .Fields("FservD") = fe2.F1DetalleFchServDesde
                        .Fields("FservH") = fe2.F1DetalleFchServHasta
                        .Fields("FPago") = fe2.F1DetalleFchVtoPago
                        .Fields("CAE") = fe2.F1RespuestaDetalleCae
                        .Fields("VtoCAE") = fe2.F1RespuestaDetalleCAEFchVto
                        .Fields("ObsCAE") = fe2.F1RespuestaDetalleResultado
                        .Fields("MotivoCAE") = Mid(fe2.F1RespuestaDetalleObservacionMsg, 1, 50)
                        .Fields("TipoSistema") = tCompS
                        .Update
                    End With
                Else
                    MsgBox "Nuevo"
                    Set rsEncabFact = Nothing
                    Set rsEncabFact = db.OpenRecordset("EncabFE")
                    With rsEncabFact
                        .AddNew
                        .Fields("Indice") = fe2.f1Indice
                        .Fields("CodClie") = Vcodclie
                        .Fields("FechaFE") = fe2.F1DetalleCbteFch
                        .Fields("TotalNetoFE") = fe2.F1DetalleImpNeto
                        .Fields("TotalIVAFE") = fe2.F1DetalleImpIva
                        .Fields("TotalGralFE") = fe2.F1DetalleImpTotal
                        .Fields("FVto") = fe2.F1DetalleFchVtoPago
                        .Fields("FservD") = fe2.F1DetalleFchServDesde
                        .Fields("FservH") = fe2.F1DetalleFchServHasta
                        .Fields("FPago") = fe2.F1DetalleFchVtoPago
                        .Fields("CAE") = fe2.F1RespuestaDetalleCae
                        .Fields("VtoCAE") = fe2.F1RespuestaDetalleCAEFchVto
                        .Fields("ObsCAE") = fe2.F1RespuestaDetalleResultado
                        .Fields("MotivoCAE") = Mid(fe2.F1RespuestaDetalleObservacionMsg, 1, 50)
                        .Fields("TipoSistema") = tCompS
                        .Update
                    End With
                End If
            ElseIf Comp.ListIndex = 3 Then
                Set rsEncabFact = db.OpenRecordset("EncabLProd")
                
                    VCUIT = Mid(fe2.F1DetalleDocNro, 1, 2) & "-" & Mid(fe2.F1DetalleDocNro, 3, 8) & "-" & Mid(fe2.F1DetalleDocNro, 11, 1)
                    Set rsFleteros = db.OpenRecordset("Select * From Fleteros Where CUIT = '" & VCUIT & "'")
                    Vcodclie = rsFleteros!codflet
                With rsEncabFact
                    .AddNew
                    .Fields("Indice") = fe2.f1Indice
                    .Fields("NroComp") = NroFact
                    .Fields("PtoVta") = PtoVta
                    .Fields("Fecha") = fe2.F1RespuestaDetalleCbteFch
                    .Fields("CodFlet") = Vcodclie
                    .Fields("NetoComis") = fe2.F1DetalleImpNeto
                    .Fields("IvaComis") = fe2.F1DetalleImpIva
                    .Fields("TotalComis") = fe2.F1DetalleImpTotal
                    .Fields("FVto") = fe2.F1DetalleFchVtoPago
                    .Fields("FservD") = fe2.F1DetalleFchServDesde
                    .Fields("FservH") = fe2.F1DetalleFchServHasta
                    .Fields("FPago") = fe2.F1DetalleFchVtoPago
                    .Fields("CAE") = fe2.F1RespuestaDetalleCae
                    .Fields("VtoCAE") = fe2.F1RespuestaDetalleCAEFchVto
                    .Fields("ObsCAE") = fe2.F1RespuestaDetalleResultado
                    .Fields("MotivoCAE") = Mid(fe2.F1RespuestaDetalleObservacionMsg, 1, 50)
                    .Update
                End With
            End If
        Else
            MsgBox fe2.f1ErrorMsg
        End If
    Else
        MsgBox "No pudo acceder"
    End If
End If
End Sub
