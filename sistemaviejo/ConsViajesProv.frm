VERSION 5.00
Object = "{D18BBD1F-82BB-4385-BED3-E9D31A3E361E}#1.0#0"; "kewlbuttonz.ocx"
Object = "{C932BA88-4374-101B-A56C-00AA003668DC}#1.1#0"; "MSMASK32.OCX"
Begin VB.Form ConsViajesProv 
   BackColor       =   &H80000007&
   Caption         =   "Detalle de Viajes por Provincia"
   ClientHeight    =   2205
   ClientLeft      =   60
   ClientTop       =   345
   ClientWidth     =   6225
   LinkTopic       =   "Form1"
   MDIChild        =   -1  'True
   ScaleHeight     =   2205
   ScaleWidth      =   6225
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   0
      Left            =   1320
      TabIndex        =   4
      Text            =   "Text1"
      Top             =   960
      Visible         =   0   'False
      Width           =   615
   End
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   1
      Left            =   2040
      TabIndex        =   3
      Text            =   "Text1"
      Top             =   1320
      Visible         =   0   'False
      Width           =   4095
   End
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   2
      Left            =   1320
      TabIndex        =   1
      Text            =   "Text1"
      Top             =   1320
      Visible         =   0   'False
      Width           =   615
   End
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   3
      Left            =   2040
      TabIndex        =   0
      Text            =   "Text1"
      Top             =   1320
      Visible         =   0   'False
      Width           =   4095
   End
   Begin MSMask.MaskEdBox FDesde 
      Height          =   285
      Left            =   1320
      TabIndex        =   2
      Top             =   600
      Width           =   1575
      _ExtentX        =   2778
      _ExtentY        =   503
      _Version        =   393216
      PromptChar      =   "_"
   End
   Begin MSMask.MaskEdBox FHasta 
      Height          =   285
      Left            =   4560
      TabIndex        =   5
      Top             =   600
      Width           =   1575
      _ExtentX        =   2778
      _ExtentY        =   503
      _Version        =   393216
      PromptChar      =   "_"
   End
   Begin KewlButtonz.KewlButtons Buscar 
      Height          =   495
      Left            =   1560
      TabIndex        =   6
      Top             =   1680
      Width           =   3135
      _ExtentX        =   5530
      _ExtentY        =   873
      BTYPE           =   1
      TX              =   "Consultar"
      ENAB            =   -1  'True
      BeginProperty FONT {0BE35203-8F91-11CE-9DE3-00AA004BB851} 
         Name            =   "MS Sans Serif"
         Size            =   8.25
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      COLTYPE         =   2
      FOCUSR          =   -1  'True
      BCOL            =   4210752
      BCOLO           =   4210752
      FCOL            =   14737632
      FCOLO           =   16777215
      MCOL            =   4210752
      MPTR            =   1
      MICON           =   "ConsViajesProv.frx":0000
      PICN            =   "ConsViajesProv.frx":001C
      UMCOL           =   -1  'True
      SOFT            =   0   'False
      PICPOS          =   0
      NGREY           =   0   'False
      FX              =   1
      HAND            =   0   'False
      CHECK           =   0   'False
      VALUE           =   0   'False
   End
   Begin VB.Label Label1 
      BackColor       =   &H80000007&
      Caption         =   "Empresa"
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   9.75
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      ForeColor       =   &H0080C0FF&
      Height          =   255
      Index           =   0
      Left            =   120
      TabIndex        =   10
      Top             =   960
      Visible         =   0   'False
      Width           =   1215
   End
   Begin VB.Label Label1 
      BackColor       =   &H80000007&
      Caption         =   "Desde:"
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   9.75
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      ForeColor       =   &H0080C0FF&
      Height          =   255
      Index           =   1
      Left            =   120
      TabIndex        =   9
      Top             =   600
      Width           =   1215
   End
   Begin VB.Label Label1 
      BackColor       =   &H80000007&
      Caption         =   "Hasta:"
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   9.75
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      ForeColor       =   &H0080C0FF&
      Height          =   255
      Index           =   2
      Left            =   3120
      TabIndex        =   8
      Top             =   600
      Width           =   1215
   End
   Begin VB.Label Label1 
      BackColor       =   &H80000007&
      Caption         =   "Fletero"
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   9.75
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      ForeColor       =   &H0080C0FF&
      Height          =   255
      Index           =   3
      Left            =   120
      TabIndex        =   7
      Top             =   1320
      Visible         =   0   'False
      Width           =   1215
   End
End
Attribute VB_Name = "ConsViajesProv"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Private Sub Buscar_Click()
Dim TotalDet As Double
On Error Resume Next
If Not FDESDE.Text = "__/__/____" And Not FHASTA.Text = "__/__/____" Then
    Set TrsConsultas = dbTemp.OpenRecordset("Select * From Consultas")
    Do While Not TrsConsultas.EOF
        TrsConsultas.Delete
        TrsConsultas.MoveNext
    Loop
    TrsConsultas.AddNew
    TrsConsultas.Fields("FDede") = FDESDE
    TrsConsultas.Fields("FHasta") = FHASTA
    TrsConsultas.Update
    Set rsViajesFlet = dbTemp.OpenRecordset("SELECT * FROM ViajesFlet")
    Do While Not rsViajesFlet.EOF
            rsViajesFlet.Delete
            rsViajesFlet.MoveNext
    Loop
    Set rsEncabFactCta = db.OpenRecordset("Select * from EncabFactCta Where Fecha BETWEEN # " + Format(FDESDE, "mm/dd/yyyy") + " # AND # " + Format(FHASTA, "mm/dd/yyyy") + " # ORDER BY Fecha")
    Do While Not rsEncabFactCta.EOF
        Set rsDetFactCta = db.OpenRecordset("Select * from DetFActCta Where NroFact = " & rsEncabFactCta!NroFact & "")
        Do While Not rsDetFactCta.EOF
            Set rsViajes = db.OpenRecordset("SELECT * FROM LiqDetViajes WHERE NroRemito = '" & rsDetFactCta!NroRem & "' and CodFlet = " & rsDetFactCta!codflet & "")
            'If Not rsViajes.EOF And Not rsViajes.BOF Then
                'Do While Not rsViajes.EOF
                    rsViajesFlet.AddNew
                    rsViajesFlet.Fields("Fecha") = rsDetFactCta!FechaViaje
                    rsViajesFlet.Fields("NroRem") = rsDetFactCta!NroRem
                    rsViajesFlet.Fields("CodEmp") = rsViajes!CodEmpresa
                    rsViajesFlet.Fields("NroLiq") = rsViajes!NroLiq
                    rsViajesFlet.Fields("DescEmpresa") = rsViajes!DescEmpresa
                    rsViajesFlet.Fields("DescChofer") = rsViajes!DescChofer
                    rsViajesFlet.Fields("Mercaderia") = rsViajes!mERCADERIA
                    rsViajesFlet.Fields("Procedencia") = rsViajes!pROCEDENCIA
                    rsViajesFlet.Fields("Destino") = rsViajes!dESTINO
                    rsViajesFlet.Fields("Tarifa") = rsViajes!tarifa
                    rsViajesFlet.Fields("Kilos") = rsViajes!kilos
                    rsViajesFlet.Fields("SubTotal") = rsDetFactCta!STotal
                    rsViajesFlet.Fields("CodFlet") = rsViajes!codflet
                    Set rsFleteros = db.OpenRecordset("Select * from Fleteros Where CodFlet = " & rsViajes!codflet & "", 2)
                    rsViajesFlet.Fields("DescFlet") = rsFleteros!DescFlet
                    rsViajesFlet.Fields("Comision") = rsFleteros!Comision
                    rsViajesFlet.Fields("ImpComis") = (rsViajes!sUBTOTAL * rsFleteros!Comision) / 100
                    rsViajesFlet.Fields("Prov") = rsViajes!Provincia
                    Set rsprovincia = db.OpenRecordset("Select * from Provincias Where CodProv = " & rsViajes!Provincia & "")
                    rsViajesFlet.Fields("DescProv") = rsprovincia!DescProv
                    rsViajesFlet.Update
                    TotalDet = TotalDet + rsDetFactCta!STotal
                    'rsViajes.MoveNext
                'Loop
                rsDetFactCta.MoveNext
            'End If
        Loop
        If Not FormatNumber(TotalDet) = FormatNumber(rsEncabFactCta!TNeto) Then
            If Not rsEncabFactCta!Codigo = 99999 Then
                MsgBox "Diferencia en la factura nro: " & rsEncabFactCta!NroFact
                rsViajesFlet.AddNew
                rsViajesFlet.Fields("Mercaderia") = "Diferencia en Factura Nro: " & rsEncabFactCta!NroFact
                rsViajesFlet.Fields("SubTotal") = rsEncabFactCta!TNeto - TotalDet
                rsViajesFlet.Update
            End If
        End If
        TotalDet = 0
        rsEncabFactCta.MoveNext
    Loop
   '////// facturas A //////
    Set rsEncabFactCta = db.OpenRecordset("Select * from EncabFE Where FechaFE BETWEEN # " + Format(FDESDE, "mm/dd/yyyy") + " # AND # " + Format(FHASTA, "mm/dd/yyyy") + " # ORDER BY FechaFE")
    Do While Not rsEncabFactCta.EOF
        If rsEncabFactCta!ClaseFact = 1 Then
            Set rsDetFactCta = db.OpenRecordset("Select * from DetFE Where NroFact = " & rsEncabFactCta!NroFE & " and TipoComp = " & rsEncabFactCta!TipoAfip & " and PtoVta = " & rsEncabFactCta!PTOVTAFE & " ")
            Do While Not rsDetFactCta.EOF
                Set rsViajes = db.OpenRecordset("SELECT * FROM LiqDetViajes WHERE NroRemito = '" & rsDetFactCta!NroRem & "'")
                
                'If Not rsViajes.EOF And Not rsViajes.BOF Then
                    rsViajesFlet.AddNew
                    rsViajesFlet.Fields("Fecha") = rsViajes!Fecha
                    rsViajesFlet.Fields("NroRem") = rsDetFactCta!NroRem
                    rsViajesFlet.Fields("CodEmp") = rsViajes!CodEmpresa
                    rsViajesFlet.Fields("NroLiq") = rsViajes!NroLiq
                    rsViajesFlet.Fields("DescEmpresa") = rsViajes!DescEmpresa
                    rsViajesFlet.Fields("DescChofer") = rsViajes!DescChofer
                    rsViajesFlet.Fields("Mercaderia") = rsViajes!mERCADERIA
                    rsViajesFlet.Fields("Procedencia") = rsViajes!pROCEDENCIA
                    rsViajesFlet.Fields("Destino") = rsViajes!dESTINO
                    rsViajesFlet.Fields("Tarifa") = rsViajes!tarifa
                    rsViajesFlet.Fields("Kilos") = rsViajes!kilos
                    rsViajesFlet.Fields("SubTotal") = rsDetFactCta!STotal
                    rsViajesFlet.Fields("CodFlet") = rsViajes!codflet
                    Set rsFleteros = db.OpenRecordset("Select * from Fleteros Where CodFlet = " & rsViajes!codflet & "", 2)
                    rsViajesFlet.Fields("DescFlet") = rsFleteros!DescFlet
                    rsViajesFlet.Fields("Comision") = rsFleteros!Comision
                    rsViajesFlet.Fields("ImpComis") = (rsViajes!sUBTOTAL * rsFleteros!Comision) / 100
                    rsViajesFlet.Fields("Prov") = rsViajes!Provincia
                    Set rsprovincia = db.OpenRecordset("Select * from Provincias Where CodProv = " & rsViajes!Provincia & "")
                    rsViajesFlet.Fields("DescProv") = rsprovincia!DescProv
                    rsViajesFlet.Update
                    TotalDet = TotalDet + rsDetFactCta!STotal
                    
                rsDetFactCta.MoveNext
            Loop
        Else '/// ES FACTURA POR COMISION O NC
            
            Set rsDetFactCta = db.OpenRecordset("Select * from DetFE Where NroFact = " & rsEncabFactCta!Nro_Asoc & " and TipoComp = " & rsEncabFactCta!TipoComp_Asoc & " and PtoVta = " & rsEncabFactCta!PtoVta_Asoc & " ")
            Do While Not rsDetFactCta.EOF
                TotalDet = TotalDet + rsDetFactCta!STotal
                rsDetFactCta.MoveNext
            Loop
            If TotalDet = rsEncabFactCta!TotalNetofe Then
                rsDetFactCta.MoveFirst
                TotalDet = 0
                Do While Not rsDetFactCta.EOF
                    Set rsViajes = db.OpenRecordset("SELECT * FROM LiqDetViajes WHERE NroRemito = '" & rsDetFactCta!NroRem & "'")
                    rsViajesFlet.AddNew
                    rsViajesFlet.Fields("Fecha") = rsViajes!Fecha
                    rsViajesFlet.Fields("NroRem") = rsDetFactCta!NroRem
                    rsViajesFlet.Fields("CodEmp") = rsViajes!CodEmpresa
                    rsViajesFlet.Fields("NroLiq") = rsViajes!NroLiq
                    rsViajesFlet.Fields("DescEmpresa") = rsViajes!DescEmpresa
                    rsViajesFlet.Fields("DescChofer") = rsViajes!DescChofer
                    rsViajesFlet.Fields("Mercaderia") = rsViajes!mERCADERIA
                    rsViajesFlet.Fields("Procedencia") = rsViajes!pROCEDENCIA
                    rsViajesFlet.Fields("Destino") = rsViajes!dESTINO
                    rsViajesFlet.Fields("Tarifa") = rsViajes!tarifa
                    rsViajesFlet.Fields("Kilos") = rsViajes!kilos
                    If rsEncabFactCta!ClaseFact = 2 Or rsEncabFactCta!ClaseFact = 4 Then
                        rsViajesFlet.Fields("SubTotal") = rsDetFactCta!STotal
                    Else
                         rsViajesFlet.Fields("SubTotal") = rsDetFactCta!STotal * -1
                    End If
                    rsViajesFlet.Fields("CodFlet") = rsViajes!codflet
                    Set rsFleteros = db.OpenRecordset("Select * from Fleteros Where CodFlet = " & rsViajes!codflet & "", 2)
                    rsViajesFlet.Fields("DescFlet") = rsFleteros!DescFlet
                    rsViajesFlet.Fields("Comision") = rsFleteros!Comision
                    rsViajesFlet.Fields("ImpComis") = (rsViajes!sUBTOTAL * rsFleteros!Comision) / 100
                    rsViajesFlet.Fields("Prov") = rsViajes!Provincia
                    Set rsprovincia = db.OpenRecordset("Select * from Provincias Where CodProv = " & rsViajes!Provincia & "")
                    rsViajesFlet.Fields("DescProv") = rsprovincia!DescProv
                    rsViajesFlet.Update
                    TotalDet = TotalDet + rsDetFactCta!STotal
                    rsDetFactCta.MoveNext
                Loop
            Else
                MsgBox "El importe de la NC es menor a el importe de la factura aplicada"
                 
                 MsgBox "Diferencia en la factura electronica nro: " & rsEncabFactCta!NroFE
                rsViajesFlet.AddNew
                rsViajesFlet.Fields("Mercaderia") = "Diferencia en Factura Nro: " & rsEncabFactCta!NroFE
                rsViajesFlet.Fields("SubTotal") = rsEncabFactCta!TotalNetofe * -1
                rsViajesFlet.Fields("Prov") = 4
                rsViajesFlet.Fields("DescProv") = "BUENOS AIRES"
                
                rsViajesFlet.Update
            End If
           
        End If
        TotalDet = 0
        rsEncabFactCta.MoveNext
    Loop
    '' LIQUIDOS PRODUCTOS ANULADOS
     Set rsEncabFactCta = db.OpenRecordset("Select * from EncabLProd Where Fecha BETWEEN # " + Format(FDESDE, "mm/dd/yyyy") + " # AND # " + Format(FHASTA, "mm/dd/yyyy") + " # ORDER BY Fecha")
    Do While Not rsEncabFactCta.EOF
        If rsEncabFactCta!totalviajeS1 = 0 Then
        
            rsViajesFlet.AddNew
            rsViajesFlet.Fields("Fecha") = rsEncabFactCta!Fecha
            rsViajesFlet.Fields("NroRem") = rsEncabFactCta!NroComp
            'rsViajesFlet.Fields("CodEmp") = ""
           ' rsViajesFlet.Fields("NroLiq") = ""
            'rsViajesFlet.Fields("DescEmpresa") = ""
            'rsViajesFlet.Fields("DescChofer") = ""
            rsViajesFlet.Fields("Mercaderia") = "Liquido Producto Anulado"
            'rsViajesFlet.Fields("Procedencia") = ""
            'rsViajesFlet.Fields("Destino") = ""
            'rsViajesFlet.Fields("Tarifa") = ""
            'rsViajesFlet.Fields("Kilos") = ""
            
            rsViajesFlet.Fields("SubTotal") = rsEncabFactCta!netocomis
            
            rsViajesFlet.Fields("CodFlet") = rsEncabFactCta!CodClie
            Set rsFleteros = db.OpenRecordset("Select * from Fleteros Where CodFlet = " & rsEncabFactCta!codflet & "", 2)
            rsViajesFlet.Fields("DescFlet") = rsFleteros!DescFlet
            rsViajesFlet.Fields("Comision") = rsFleteros!Comision
            'rsViajesFlet.Fields("ImpComis") = ""
            rsViajesFlet.Fields("Prov") = 2
            Set rsprovincia = db.OpenRecordset("Select * from Provincias Where CodProv = 2")
            rsViajesFlet.Fields("DescProv") = rsprovincia!DescProv
            rsViajesFlet.Update
            
        End If
        rsEncabFactCta.MoveNext
    Loop
    
    
    
        
        Dim frmRep As New InfViajesPorProv
        frmRep.Show vbModal
Else
    MsgBox "Existen campos sin completar"
End If
End Sub

Private Sub Form_Load()
Text1(0).Text = ""
Text1(1).Text = ""
Text1(2).Text = ""
Text1(3).Text = ""
FDESDE.Mask = ""
FDESDE.Text = ""
FDESDE.Mask = "##/##/####"
FHASTA.Mask = ""
FHASTA.Text = ""
FHASTA.Mask = "##/##/####"
End Sub

Private Sub Text1_LostFocus(Index As Integer)
Select Case Index
    Case 0:
        If Not Text1(0) = "" Then
            Set rsEmpresas = db.OpenRecordset("SELECT * FROM Empresas WHERE CodEmpresas = " & Text1(0) & "")
            If Not rsEmpresas.EOF And Not rsEmpresas.BOF Then
                Text1(1) = rsEmpresas!DescEmpresas
            End If
        End If
    Case 2:
        If Not Text1(2) = "" Then
            Set rsFleteros = db.OpenRecordset("Select * from Fleteros Where CodFlet = " & Text1(2) & "", 2)
            If Not rsFleteros.EOF And Not rsFleteros.BOF Then
                Text1(3) = rsFleteros!DescFlet
            End If
        End If
End Select
End Sub

