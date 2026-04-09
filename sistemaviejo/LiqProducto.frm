VERSION 5.00
Object = "{D18BBD1F-82BB-4385-BED3-E9D31A3E361E}#1.0#0"; "kewlbuttonz.ocx"
Object = "{C932BA88-4374-101B-A56C-00AA003668DC}#1.1#0"; "MSMASK32.OCX"
Object = "{FF19AA0C-2968-41B8-A906-E80997A9C394}#253.0#0"; "WSAFIPFEOCX.ocx"
Object = "{831FDD16-0C5C-11D2-A9FC-0000F8754DA1}#2.0#0"; "MSCOMCTL.OCX"
Begin VB.Form LiqProducto 
   Caption         =   "Cuenta de Venta y Liquido Producto"
   ClientHeight    =   8265
   ClientLeft      =   120
   ClientTop       =   450
   ClientWidth     =   11985
   KeyPreview      =   -1  'True
   LinkTopic       =   "Form1"
   MDIChild        =   -1  'True
   ScaleHeight     =   8265
   ScaleWidth      =   11985
   Begin WSAFIPFEOCX.WSAFIPFEx FELP 
      Left            =   5520
      Top             =   0
      _ExtentX        =   3201
      _ExtentY        =   661
   End
   Begin MSMask.MaskEdBox Fecha 
      Height          =   255
      Left            =   9600
      TabIndex        =   3
      Top             =   480
      Width           =   1335
      _ExtentX        =   2355
      _ExtentY        =   450
      _Version        =   393216
      PromptChar      =   "_"
   End
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   2
      Left            =   7560
      TabIndex        =   2
      Text            =   "Text1"
      Top             =   480
      Width           =   615
   End
   Begin VB.Frame Frame2 
      Caption         =   "Carga de Viajes"
      Height          =   2295
      Left            =   240
      TabIndex        =   31
      Top             =   960
      Width           =   11655
      Begin VB.TextBox Text1 
         Height          =   285
         Index           =   3
         Left            =   4080
         TabIndex        =   8
         Text            =   "Text1"
         Top             =   720
         Width           =   1935
      End
      Begin MSMask.MaskEdBox FechaViaje 
         Height          =   255
         Left            =   1440
         TabIndex        =   4
         Top             =   360
         Width           =   1215
         _ExtentX        =   2143
         _ExtentY        =   450
         _Version        =   393216
         PromptChar      =   "_"
      End
      Begin VB.TextBox Text1 
         Height          =   285
         Index           =   14
         Left            =   7800
         TabIndex        =   42
         Text            =   "Text1"
         Top             =   1800
         Width           =   1935
      End
      Begin VB.TextBox Text1 
         Height          =   285
         Index           =   13
         Left            =   4800
         TabIndex        =   16
         Text            =   "Text1"
         Top             =   1800
         Width           =   1575
      End
      Begin VB.TextBox Text1 
         Height          =   285
         Index           =   12
         Left            =   1440
         TabIndex        =   15
         Text            =   "Text1"
         Top             =   1800
         Width           =   1935
      End
      Begin VB.TextBox Text1 
         Height          =   285
         Index           =   11
         Left            =   7800
         TabIndex        =   14
         Text            =   "Text1"
         Top             =   1440
         Width           =   1935
      End
      Begin VB.ComboBox Provincia 
         Height          =   315
         Left            =   4800
         TabIndex        =   13
         Text            =   "Combo1"
         Top             =   1440
         Width           =   1575
      End
      Begin VB.TextBox Text1 
         Height          =   285
         Index           =   10
         Left            =   1440
         TabIndex        =   12
         Text            =   "Text1"
         Top             =   1440
         Width           =   1935
      End
      Begin VB.TextBox Text1 
         Height          =   285
         Index           =   9
         Left            =   1440
         TabIndex        =   11
         Text            =   "Text1"
         Top             =   1080
         Width           =   6255
      End
      Begin VB.TextBox Text1 
         Height          =   285
         Index           =   8
         Left            =   8160
         TabIndex        =   10
         Text            =   "Text1"
         Top             =   720
         Width           =   2775
      End
      Begin VB.TextBox Text1 
         Height          =   285
         Index           =   7
         Left            =   7560
         TabIndex        =   9
         Text            =   "Text1"
         Top             =   720
         Width           =   495
      End
      Begin VB.TextBox Text1 
         Height          =   285
         Index           =   6
         Left            =   1440
         TabIndex        =   7
         Text            =   "Text1"
         Top             =   720
         Width           =   1215
      End
      Begin VB.TextBox Text1 
         Height          =   285
         Index           =   5
         Left            =   4920
         TabIndex        =   6
         Text            =   "Text1"
         Top             =   360
         Width           =   2775
      End
      Begin VB.TextBox Text1 
         Height          =   285
         Index           =   4
         Left            =   4320
         TabIndex        =   5
         Text            =   "Text1"
         Top             =   360
         Width           =   495
      End
      Begin KewlButtonz.KewlButtons AgregarViaje 
         Height          =   375
         Left            =   8280
         TabIndex        =   17
         Top             =   240
         Width           =   1455
         _ExtentX        =   2566
         _ExtentY        =   661
         BTYPE           =   1
         TX              =   "Agregar"
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
         MICON           =   "LiqProducto.frx":0000
         UMCOL           =   -1  'True
         SOFT            =   0   'False
         PICPOS          =   0
         NGREY           =   0   'False
         FX              =   1
         HAND            =   0   'False
         CHECK           =   0   'False
         VALUE           =   0   'False
      End
      Begin KewlButtonz.KewlButtons EliminarViaje 
         Height          =   375
         Left            =   9960
         TabIndex        =   44
         Top             =   240
         Width           =   1455
         _ExtentX        =   2566
         _ExtentY        =   661
         BTYPE           =   1
         TX              =   "Eliminar"
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
         FCOL            =   12632256
         FCOLO           =   4210752
         MCOL            =   4210752
         MPTR            =   1
         MICON           =   "LiqProducto.frx":001C
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
         Alignment       =   2  'Center
         BackColor       =   &H8000000A&
         Caption         =   "Cupo"
         Height          =   255
         Index           =   24
         Left            =   2760
         TabIndex        =   48
         Top             =   720
         Width           =   1215
      End
      Begin VB.Label Label1 
         Alignment       =   2  'Center
         BackColor       =   &H8000000A&
         Caption         =   "Chofer"
         Height          =   255
         Index           =   5
         Left            =   6240
         TabIndex        =   47
         Top             =   720
         Width           =   1215
      End
      Begin VB.Label Label1 
         Alignment       =   2  'Center
         BackColor       =   &H8000000A&
         Caption         =   "SubTotal"
         Height          =   255
         Index           =   22
         Left            =   6480
         TabIndex        =   41
         Top             =   1800
         Width           =   1215
      End
      Begin VB.Label Label1 
         Alignment       =   2  'Center
         BackColor       =   &H8000000A&
         Caption         =   "Tarifa"
         Height          =   255
         Index           =   21
         Left            =   3480
         TabIndex        =   40
         Top             =   1800
         Width           =   1215
      End
      Begin VB.Label Label1 
         Alignment       =   2  'Center
         BackColor       =   &H8000000A&
         Caption         =   "Kilos"
         Height          =   255
         Index           =   20
         Left            =   120
         TabIndex        =   39
         Top             =   1800
         Width           =   1215
      End
      Begin VB.Label Label1 
         Alignment       =   2  'Center
         BackColor       =   &H8000000A&
         Caption         =   "Destino"
         Height          =   255
         Index           =   9
         Left            =   6480
         TabIndex        =   38
         Top             =   1440
         Width           =   1215
      End
      Begin VB.Label Label1 
         Alignment       =   2  'Center
         BackColor       =   &H8000000A&
         Caption         =   "Provincia "
         Height          =   255
         Index           =   8
         Left            =   3480
         TabIndex        =   37
         Top             =   1440
         Width           =   1215
      End
      Begin VB.Label Label1 
         Alignment       =   2  'Center
         BackColor       =   &H8000000A&
         Caption         =   "Procedencia"
         Height          =   255
         Index           =   7
         Left            =   120
         TabIndex        =   36
         Top             =   1440
         Width           =   1215
      End
      Begin VB.Label Label1 
         Alignment       =   2  'Center
         BackColor       =   &H8000000A&
         Caption         =   "Mercaderia"
         Height          =   255
         Index           =   6
         Left            =   120
         TabIndex        =   35
         Top             =   1080
         Width           =   1215
      End
      Begin VB.Label Label1 
         Alignment       =   2  'Center
         BackColor       =   &H8000000A&
         Caption         =   "Remito"
         Height          =   255
         Index           =   4
         Left            =   120
         TabIndex        =   34
         Top             =   720
         Width           =   1215
      End
      Begin VB.Label Label1 
         Alignment       =   2  'Center
         BackColor       =   &H8000000A&
         Caption         =   "Empresa"
         Height          =   255
         Index           =   3
         Left            =   3000
         TabIndex        =   33
         Top             =   360
         Width           =   1215
      End
      Begin VB.Label Label1 
         Alignment       =   2  'Center
         BackColor       =   &H8000000A&
         Caption         =   "Fecha Viaje"
         Height          =   255
         Index           =   2
         Left            =   120
         TabIndex        =   32
         Top             =   360
         Width           =   1215
      End
   End
   Begin VB.Frame Frame1 
      Caption         =   "Totales"
      Height          =   1215
      Left            =   1800
      TabIndex        =   20
      Top             =   6240
      Width           =   7455
      Begin VB.Label Label1 
         Alignment       =   2  'Center
         BorderStyle     =   1  'Fixed Single
         Height          =   255
         Index           =   19
         Left            =   5640
         TabIndex        =   30
         Top             =   720
         Width           =   1215
      End
      Begin VB.Label Label1 
         Alignment       =   2  'Center
         BackColor       =   &H8000000A&
         Caption         =   "Total"
         Height          =   255
         Index           =   18
         Left            =   5640
         TabIndex        =   29
         Top             =   360
         Width           =   1215
      End
      Begin VB.Label Label1 
         Alignment       =   2  'Center
         BorderStyle     =   1  'Fixed Single
         Height          =   255
         Index           =   11
         Left            =   240
         TabIndex        =   28
         Top             =   720
         Width           =   1215
      End
      Begin VB.Label Label1 
         Alignment       =   2  'Center
         BackColor       =   &H8000000A&
         Caption         =   "Sub Total"
         Height          =   255
         Index           =   10
         Left            =   240
         TabIndex        =   27
         Top             =   360
         Width           =   1215
      End
      Begin VB.Label Label1 
         Alignment       =   2  'Center
         BorderStyle     =   1  'Fixed Single
         Height          =   255
         Index           =   17
         Left            =   4320
         TabIndex        =   26
         Top             =   720
         Width           =   1215
      End
      Begin VB.Label Label1 
         Alignment       =   2  'Center
         BackColor       =   &H8000000A&
         Caption         =   "IVA"
         Height          =   255
         Index           =   16
         Left            =   4320
         TabIndex        =   25
         Top             =   360
         Width           =   1215
      End
      Begin VB.Label Label1 
         Alignment       =   2  'Center
         BorderStyle     =   1  'Fixed Single
         Height          =   255
         Index           =   15
         Left            =   2880
         TabIndex        =   24
         Top             =   720
         Width           =   1335
      End
      Begin VB.Label Label1 
         Alignment       =   2  'Center
         BackColor       =   &H8000000A&
         Caption         =   "Neto"
         Height          =   255
         Index           =   14
         Left            =   2880
         TabIndex        =   23
         Top             =   360
         Width           =   1335
      End
      Begin VB.Label Label1 
         Alignment       =   2  'Center
         BorderStyle     =   1  'Fixed Single
         Height          =   255
         Index           =   13
         Left            =   1560
         TabIndex        =   22
         Top             =   720
         Width           =   1215
      End
      Begin VB.Label Label1 
         Alignment       =   2  'Center
         BackColor       =   &H8000000A&
         Caption         =   "Comisión"
         Height          =   255
         Index           =   12
         Left            =   1560
         TabIndex        =   21
         Top             =   360
         Width           =   1215
      End
   End
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   1
      Left            =   2280
      TabIndex        =   1
      Text            =   "Text1"
      Top             =   480
      Width           =   3975
   End
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   0
      Left            =   1200
      TabIndex        =   0
      Text            =   "Text1"
      Top             =   480
      Width           =   975
   End
   Begin KewlButtonz.KewlButtons Aceptar 
      Height          =   375
      Left            =   4080
      TabIndex        =   45
      Top             =   7680
      Width           =   2655
      _ExtentX        =   4683
      _ExtentY        =   661
      BTYPE           =   1
      TX              =   "Grabar"
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
      MICON           =   "LiqProducto.frx":0038
      UMCOL           =   -1  'True
      SOFT            =   0   'False
      PICPOS          =   0
      NGREY           =   0   'False
      FX              =   1
      HAND            =   0   'False
      CHECK           =   0   'False
      VALUE           =   0   'False
   End
   Begin MSComctlLib.ListView ListaViajes 
      Height          =   2535
      Left            =   240
      TabIndex        =   46
      Top             =   3360
      Width           =   11700
      _ExtentX        =   20638
      _ExtentY        =   4471
      View            =   3
      LabelWrap       =   0   'False
      HideSelection   =   0   'False
      FullRowSelect   =   -1  'True
      GridLines       =   -1  'True
      _Version        =   393217
      ForeColor       =   -2147483640
      BackColor       =   -2147483643
      BorderStyle     =   1
      Appearance      =   1
      NumItems        =   16
      BeginProperty ColumnHeader(1) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
         Text            =   "Fecha"
         Object.Width           =   1764
      EndProperty
      BeginProperty ColumnHeader(2) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
         SubItemIndex    =   1
         Text            =   "Nro Rem"
         Object.Width           =   1411
      EndProperty
      BeginProperty ColumnHeader(3) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
         SubItemIndex    =   2
         Text            =   "Empresa"
         Object.Width           =   2646
      EndProperty
      BeginProperty ColumnHeader(4) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
         SubItemIndex    =   3
         Text            =   "Chofer"
         Object.Width           =   2646
      EndProperty
      BeginProperty ColumnHeader(5) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
         SubItemIndex    =   4
         Text            =   "Mercaderia"
         Object.Width           =   2117
      EndProperty
      BeginProperty ColumnHeader(6) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
         SubItemIndex    =   5
         Text            =   "Procedencia"
         Object.Width           =   2117
      EndProperty
      BeginProperty ColumnHeader(7) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
         SubItemIndex    =   6
         Text            =   "Destino"
         Object.Width           =   2117
      EndProperty
      BeginProperty ColumnHeader(8) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
         SubItemIndex    =   7
         Text            =   "Kilos"
         Object.Width           =   1764
      EndProperty
      BeginProperty ColumnHeader(9) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
         SubItemIndex    =   8
         Text            =   "Tarifa"
         Object.Width           =   1764
      EndProperty
      BeginProperty ColumnHeader(10) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
         SubItemIndex    =   9
         Text            =   "SubTotal"
         Object.Width           =   1764
      EndProperty
      BeginProperty ColumnHeader(11) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
         SubItemIndex    =   10
         Text            =   "CodEmpresa"
         Object.Width           =   353
      EndProperty
      BeginProperty ColumnHeader(12) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
         SubItemIndex    =   11
         Text            =   "CodChofer"
         Object.Width           =   353
      EndProperty
      BeginProperty ColumnHeader(13) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
         SubItemIndex    =   12
         Text            =   "Prov"
         Object.Width           =   176
      EndProperty
      BeginProperty ColumnHeader(14) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
         SubItemIndex    =   13
         Text            =   "NroViaje"
         Object.Width           =   2540
      EndProperty
      BeginProperty ColumnHeader(15) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
         SubItemIndex    =   14
         Text            =   "Facturado"
         Object.Width           =   2540
      EndProperty
      BeginProperty ColumnHeader(16) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
         SubItemIndex    =   15
         Text            =   "Cupo"
         Object.Width           =   2540
      EndProperty
   End
   Begin WSAFIPFEOCX.WSAFIPFEx fe2 
      Left            =   9360
      Top             =   6480
      _ExtentX        =   3201
      _ExtentY        =   661
   End
   Begin VB.Label Label1 
      Alignment       =   2  'Center
      BackColor       =   &H8000000A&
      Caption         =   "Comisión"
      Height          =   255
      Index           =   23
      Left            =   6480
      TabIndex        =   43
      Top             =   480
      Width           =   975
   End
   Begin VB.Label Label1 
      Alignment       =   2  'Center
      BackColor       =   &H8000000A&
      Caption         =   "Fecha"
      Height          =   255
      Index           =   1
      Left            =   8400
      TabIndex        =   19
      Top             =   480
      Width           =   975
   End
   Begin VB.Label Label1 
      Alignment       =   2  'Center
      BackColor       =   &H8000000A&
      Caption         =   "Fletero"
      Height          =   255
      Index           =   0
      Left            =   120
      TabIndex        =   18
      Top             =   480
      Width           =   975
   End
End
Attribute VB_Name = "LiqProducto"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Option Explicit
Public STotalViajes As Double, ViajesNeto As Double, ComisNeto As Double, IVAComis As Double, TComis As Double, ViajesNeto1 As Double, IVAViajes As Double, TotalViajes As Double
Public i As Integer
Public band As Boolean
Dim UltNro As String, FVto As String, FServD As String, FservH As String, FPago As String, VNetoFE As Double
Dim VivaFE As Double, FCte As String, VCUIT As String, VTipoDoc As Single, VIndice As Long, VtipoComp
Dim VCAE As String, VMOTIVO As String, VProceso As String, VNro As String
Dim largo As Integer, NRO As String, DIA As String, MES As String, AÑO As String, FVTOCAE As String
Dim OPBUSCAR As String
Dim VRuta As String
Private Sub Aceptar_Click()
If Text1(0) = 1107 Then
    Call ViajesPropios
Else
    Call ViajesTerceros
End If
End Sub
Private Sub ViajesPropios()
If ViajesNeto = 0 Then
    MsgBox "No hay Viajes Cargados"
    Exit Sub
Else
    Set rsLiqDetViajes = db.OpenRecordset("LiqDetViajes")
    Set rsViajesFact = db.OpenRecordset("ViajesFactura")
    
        i = 0
        For i = i + 1 To ListaViajes.ListItems.Count
            Set Lista = ListaViajes.ListItems.Item(i)
            With rsLiqDetViajes
            .AddNew
            .Fields("CodEmpresa") = Lista.SubItems(10)
            .Fields("Fecha") = Lista.Tag
            .Fields("NroRemito") = Lista.SubItems(1)
            .Fields("DescEmpresa") = Lista.SubItems(2)
            .Fields("CodChofer") = Lista.SubItems(11)
            .Fields("DescChofer") = Lista.SubItems(3)
            .Fields("Mercaderia") = Lista.SubItems(4)
            .Fields("Procedencia") = Lista.SubItems(5)
            .Fields("Destino") = Lista.SubItems(6)
            .Fields("Kilos") = Lista.SubItems(7)
            .Fields("Tarifa") = Lista.SubItems(8)
            .Fields("SubTotal") = Lista.SubItems(9)
            .Fields("Facturado") = "NO"
            .Fields("Provincia") = Lista.SubItems(12)
            .Fields("codFlet") = Text1(0)
            .Fields("NroViaje") = Lista.SubItems(13)
            .Fields("Cupo") = Lista.SubItems(15)
            .Update
            End With
            
            With rsViajesFact
            .AddNew
            .Fields("CodEmpresa") = Lista.SubItems(10)
            .Fields("Fecha") = Lista.Tag
            .Fields("NroRemito") = Lista.SubItems(1)
            .Fields("DescEmpresa") = Lista.SubItems(2)
            .Fields("CodChofer") = Lista.SubItems(11)
            .Fields("DescChofer") = Lista.SubItems(3)
            .Fields("Mercaderia") = Lista.SubItems(4)
            .Fields("Procedencia") = Lista.SubItems(5)
            .Fields("Destino") = Lista.SubItems(6)
            .Fields("Kilos") = Lista.SubItems(7)
            .Fields("Tarifa") = Lista.SubItems(8)
            .Fields("SubTotal") = Lista.SubItems(9)
            .Fields("Facturado") = "NO"
            .Fields("Provincia") = Lista.SubItems(12)
            .Fields("codFlet") = Text1(0)
            .Fields("NroViaje") = Lista.SubItems(13)
            .Fields("TipoComp") = 60
            .Fields("Cupo") = Lista.SubItems(15)
            .Update
            End With
            
        Next
        
        ' actualiza nro de viajes
        Set rsComprobantes = db.OpenRecordset("Select * From Comprobantes Where CodComp = 15")
        rsComprobantes.Edit
        rsComprobantes!UltNro = VNroViaje
        rsComprobantes.Update
        
        VNroViaje = 0
        ViajesNeto = 0
        ComisNeto = 0
        IVAComis = 0
        TComis = 0
        ViajesNeto1 = 0
        IVAViajes = 0
        TViajes = 0
        Call Form_Load
        MsgBox ("Grabado Correctamente")
        Set rsCtaCteProv = Nothing
    End If

End Sub
Private Sub ViajesTerceros()
On Error Resume Next
If ViajesNeto = 0 Then
    MsgBox "No hay Viajes Cargados"
    Exit Sub
Else
    Set rsEncab_LP = db.OpenRecordset("Select * From EncabLProd Order By NroComp")
    Set rsDet_LP = db.OpenRecordset("DetViajesLP")
    Set rsLiqDetViajes = db.OpenRecordset("LiqDetViajes")
    Set rsViajesFact = db.OpenRecordset("ViajesFactura")
    Set TrsEncabFact = dbTemp.OpenRecordset("EncabFact")
    Set TrsDetFact = dbTemp.OpenRecordset("DetFact")
    
    'busca número Factura
    If rsEncab_LP.EOF And rsEncab_LP.BOF Then
        VNro = 1
    Else
        rsEncab_LP.MoveLast
        VNro = rsEncab_LP.Fields("NroComp") + 1
        NroQR = rsEncab_LP.Fields("NroComp") + 1
    End If
    'llena variables
    Set rsComprobantes = db.OpenRecordset("Select * From Comprobantes Where CodComp = 60")
    UltNro = rsComprobantes!UltNro
    FVto = Mid(Fecha, 7, 4) & Mid(Fecha, 4, 2) & Mid(Fecha, 1, 2)
    FServD = Mid(Fecha, 7, 4) & Mid(Fecha, 4, 2) & Mid(Fecha, 1, 2)
    FservH = Mid(Fecha, 7, 4) & Mid(Fecha, 4, 2) & Mid(Fecha, 1, 2)
    FPago = Mid(Fecha, 7, 4) & Mid(Fecha, 4, 2) & Mid(Fecha, 1, 2)
    FCte = Mid(Fecha, 7, 4) & Mid(Fecha, 4, 2) & Mid(Fecha, 1, 2)
    Set rsFleteros = db.OpenRecordset("SELECT * FROM Fleteros WHERE Codflet = " & Text1(0) & "")
    VCUIT = Mid(rsFleteros!cuit, 1, 2) & Mid(rsFleteros!cuit, 4, 8) & Mid(rsFleteros!cuit, 13, 1)
    VTipoDoc = 80
    VtipoComp = 60
    Set rsEncab_LP = Nothing
    Set rsEncab_LP = db.OpenRecordset("Select * from EncabLProd order by indice")
    If rsEncab_LP.EOF Then
        VIndice = 0
    Else
        rsEncab_LP.MoveLast
        VIndice = rsEncab_LP!indice + 1
    End If
    '///////genera CAE//////
    With rsEncab_LP
        .AddNew
        .Fields("PtoVta") = 4
        .Fields("NroComp") = VNro
        .Fields("Fecha") = Fecha
        .Fields("CodFlet") = Text1(0)
        .Fields("Totalviajes") = FormatNumber(ViajesNeto)
        .Fields("NetoComis") = FormatNumber(ComisNeto)
        .Fields("IVAComis") = FormatNumber(IVAComis)
        .Fields("TotalComis") = FormatNumber(TComis)
        .Fields("NetoViajes") = FormatNumber(ViajesNeto1)
        .Fields("IVAViaje") = FormatNumber(IVAViajes)
        .Fields("TotalViajes1") = FormatNumber(TViajes)
        .Fields("TipoAFIP") = 60
        .Fields("TipoSistema") = 60
        .Fields("FVto") = FVto
        .Fields("FServD") = FServD
        .Fields("FServH") = FservH
        .Fields("FPago") = FPago
        .Fields("VtoCAE") = FELP.F1RespuestaDetalleCAEFchVto
        .Fields("Indice") = VIndice
        .Update
        End With
        ''' GRABA DETALLE '''
        i = 0
        For i = i + 1 To ListaViajes.ListItems.Count
            Set Lista = ListaViajes.ListItems.Item(i)
            With rsDet_LP
            .AddNew
            .Fields("PtoVta") = 4
            .Fields("NroComp") = VNro
            .Fields("FechaViaje") = Lista.Tag
            .Fields("Remito") = Lista.SubItems(1)
            .Fields("Mercaderia") = Lista.SubItems(4)
            .Fields("Procedencia") = Lista.SubItems(5)
            .Fields("Provincia") = Lista.SubItems(12)
            .Fields("Destino") = Lista.SubItems(6)
            .Fields("Kilos") = Lista.SubItems(7)
            .Fields("Tarifa") = Lista.SubItems(8)
            .Fields("SubTotal") = Lista.SubItems(9)
            .Fields("Facturado") = "NO"
            .Fields("CodFlet") = Text1(0)
            .Fields("NroViaje") = Lista.SubItems(13)
            .Fields("CodEmpresa") = Lista.SubItems(10)
            .Fields("Cupo") = Lista.SubItems(15)
            .Update
            End With
            
            With rsLiqDetViajes
            .AddNew
            .Fields("CodEmpresa") = Lista.SubItems(10)
            .Fields("Fecha") = Lista.Tag
            .Fields("NroRemito") = Lista.SubItems(1)
            .Fields("DescEmpresa") = Lista.SubItems(2)
            .Fields("CodChofer") = Lista.SubItems(11)
            .Fields("DescChofer") = Lista.SubItems(3)
            .Fields("Mercaderia") = Lista.SubItems(4)
            .Fields("Procedencia") = Lista.SubItems(5)
            .Fields("Destino") = Lista.SubItems(6)
            .Fields("Kilos") = Lista.SubItems(7)
            .Fields("Tarifa") = Lista.SubItems(8)
            .Fields("SubTotal") = Lista.SubItems(9)
            .Fields("Facturado") = "NO"
            .Fields("Provincia") = Lista.SubItems(12)
            .Fields("codFlet") = Text1(0)
            .Fields("NroViaje") = Lista.SubItems(13)
            .Fields("Cupo") = Lista.SubItems(15)
            .Update
            End With
            
            With rsViajesFact
            .AddNew
            .Fields("NroLiq") = VNro
            .Fields("CodEmpresa") = Lista.SubItems(10)
            .Fields("Fecha") = Lista.Tag
            .Fields("NroRemito") = Lista.SubItems(1)
            .Fields("DescEmpresa") = Lista.SubItems(2)
            .Fields("CodChofer") = Lista.SubItems(11)
            .Fields("DescChofer") = Lista.SubItems(3)
            .Fields("Mercaderia") = Lista.SubItems(4)
            .Fields("Procedencia") = Lista.SubItems(5)
            .Fields("Destino") = Lista.SubItems(6)
            .Fields("Kilos") = Lista.SubItems(7)
            .Fields("Tarifa") = Lista.SubItems(8)
            .Fields("SubTotal") = Lista.SubItems(9)
            .Fields("Facturado") = "NO"
            .Fields("Provincia") = Lista.SubItems(12)
            .Fields("codFlet") = Text1(0)
            .Fields("NroViaje") = Lista.SubItems(13)
            .Fields("TipoComp") = 60
            .Fields("Cupo") = Lista.SubItems(15)
            .Update
            End With
            
        Next
        '''' GRABA EN CTA CTE
        Set rsCtaCteProv = db.OpenRecordset("CtaCteProv")
        With rsCtaCteProv
        .AddNew
        .Fields("Fecha") = Fecha
        .Fields("CodProv") = Text1(0)
        .Fields("PtoVta") = 4
        .Fields("NroComp") = VNro
        .Fields("TipoComp") = 60
        .Fields("Haber") = FormatNumber(TViajes)
        .Fields("SaldoComp") = FormatNumber(TViajes)
        .Update
        End With
        ' actualiza nro de viajes
        Set rsComprobantes = db.OpenRecordset("Select * From Comprobantes Where CodComp = 15")
        rsComprobantes.Edit
        rsComprobantes!UltNro = VNroViaje
        rsComprobantes.Update
        
        VNroViaje = 0
        ViajesNeto = 0
        ComisNeto = 0
        IVAComis = 0
        TComis = 0
        ViajesNeto1 = 0
        IVAViajes = 0
        TViajes = 0
        Call Form_Load
        MsgBox ("Grabado Correctamente")
        Set rsCtaCteProv = Nothing
    End If
End Sub
Private Sub GeneraCAE()
Dim lResultado As Boolean, A As Integer, DIGITO As String, VTOTAL As String
If FELP.iniciar(modoFiscal_Fiscal, "30709381683", App.Path + "\Certificado\Certificado.pfx", App.Path + "\Certificado\WSAFIPFE.lic") Then
   FELP.ArchivoCertificadoPassword = "hercasa1509"
   If FELP.f1ObtenerTicketAcceso() Then
      FELP.F1CabeceraCantReg = 1
      FELP.F1CabeceraPtoVta = 4
      FELP.F1CabeceraCbteTipo = VtipoComp

      FELP.f1Indice = 0
      FELP.F1DetalleConcepto = 2
      FELP.F1DetalleDocTipo = VTipoDoc
      FELP.F1DetalleDocNro = VCUIT
      FELP.F1DetalleCbteDesde = VNro
      FELP.F1DetalleCbteHasta = VNro
      FELP.F1DetalleCbteFch = FCte
      FELP.F1DetalleImpTotal = FormatNumber(TViajes)
      FELP.F1DetalleImpTotalConc = 0
      FELP.F1DetalleImpNeto = FormatNumber(ViajesNeto1)
      FELP.F1DetalleImpOpEx = 0
      FELP.F1DetalleImpTrib = 0
      FELP.F1DetalleImpIva = FormatNumber(IVAViajes)
      FELP.F1DetalleFchServDesde = FServD
      FELP.F1DetalleFchServHasta = FservH
      FELP.F1DetalleFchVtoPago = FPago
      FELP.F1DetalleMonIdS = "PES"
      FELP.F1DetalleMonCotiz = 1
      FELP.F1DetalleIvaItemCantidad = 1
      FELP.f1IndiceItem = 0
      FELP.F1DetalleIvaId = 5
      FELP.F1DetalleIvaBaseImp = FormatNumber(ViajesNeto1)
      FELP.F1DetalleIvaImporte = FormatNumber(IVAViajes)

      FELP.F1DetalleCbtesAsocItemCantidad = 0
      FELP.F1DetalleOpcionalItemCantidad = 0
      
      
      FELP.ArchivoXMLRecibido = App.Path + "\XML\recibido.xml"
      FELP.ArchivoXMLEnviado = App.Path + "\XML\enviado.xml"

        lResultado = FELP.F1CAESolicitar()
    ''GENERA QR
       FELP.F1CabeceraCantReg = 1
        FELP.F1CabeceraPtoVta = 4
        FELP.F1CabeceraCbteTipo = 60
        FELP.f1Indice = 0
        FELP.qrVersion = 1
        FELP.F1DetalleConcepto = 1
        FELP.F1DetalleDocTipo = 80
                FELP.F1DetalleDocNro = VCUIT
                FELP.F1DetalleCbteDesdeS = NroQR
                
                FELP.F1DetalleCbteFch = FCte
                i = Len(FormatNumber(TViajes))
                For A = i To 1 Step -1
                    DIGITO = Mid(FormatNumber(TViajes), A, 1)
                    If Not DIGITO = "." Then
                        VTOTAL = DIGITO & VTOTAL
                    End If
                Next
                FELP.F1DetalleImpTotal = VTOTAL
                FELP.F1DetalleMonId = "PES"
                FELP.F1DetalleMonCotiz = 1
                FELP.F1Detalleqrtipocodigo = "E"
                Rem  fe.F1Detalleqrtipocodigo = "A" si es un CAE anticipado
                FELP.F1DetalleCAEA = 1
                FELP.F1DetalleQRArchivo = App.Path + "\QR\qr60_4_" & NroQR & ".jpg"
                FELP.f1detalleqrtolerancia = 1
                FELP.f1detalleqrresolucion = 4
                FELP.f1detalleqrformato = 6
                If FELP.f1qrGenerar(99) Then
                    MsgBox ("gráfico generado con los datos. " + FELP.f1qrmanualTexto)
                    
                Else
                    MsgBox ("error al generar imagen " + FELP.ArchivoQRError + " " + FELP.UltimoMensajeError)
                End If
                End If
End If
End Sub

Private Sub AgregarViaje_Click()
On Error Resume Next
If Text1(4) = "" Then
    MsgBox ("DEBE COMPLETAR LOS DATOS DEL VIAJE")
    Exit Sub
End If
Set Lista = ListaViajes.ListItems.Add(, , FechaViaje)
    Lista.Tag = FechaViaje
    Lista.SubItems(1) = Text1(6)
    Lista.SubItems(2) = Text1(5)
    Lista.SubItems(3) = Text1(8)
    Lista.SubItems(4) = Text1(9)
    Lista.SubItems(5) = Text1(10)
    Lista.SubItems(6) = Text1(11)
    Lista.SubItems(7) = Text1(12)
    Lista.SubItems(8) = Text1(13)
    Lista.SubItems(9) = Text1(14)
    Lista.SubItems(10) = Text1(4)
    Lista.SubItems(11) = Text1(7)
    Lista.SubItems(12) = Provincia.ListIndex + 1
    Lista.SubItems(13) = VNroViaje
    Lista.SubItems(14) = "NO"
    Lista.SubItems(15) = Text1(3)
    VNroViaje = VNroViaje + 1
    'calcula viajes
    ViajesNeto = ViajesNeto + Text1(14)
    Label1(11) = FormatNumber(ViajesNeto)
    'Calcula Comision
    ComisNeto = (ViajesNeto * Text1(2)) / 100
    IVAComis = (ComisNeto * 21) / 100
    TComis = ComisNeto + IVAComis
    'calcula monto a pagar
    ViajesNeto1 = ViajesNeto - ComisNeto
    IVAViajes = (ViajesNeto1 * 21) / 100
    TViajes = ViajesNeto1 + IVAViajes
    Label1(13) = FormatNumber(ComisNeto)
    Label1(15) = FormatNumber(ViajesNeto1)
    Label1(17) = FormatNumber(IVAViajes)
    Label1(19) = FormatNumber(TViajes)
    i = 3
    For i = i + 1 To Text1.Count + 1
        Select Case i - 1:
            Case 12, 13, 14:
            Text1(i - 1) = "0.00"
            band = True
        End Select
        If band = False Then
            Text1(i - 1) = ""
        Else
            band = False
        End If
    Next
    Provincia.ListIndex = 0
    FechaViaje.Text = ""
    FechaViaje.Mask = "##/##/####"
    FechaViaje = "__/__/____"
    FechaViaje.SetFocus
    Exit Sub
'ERR_cmdAgregarViajes:
   'TableError Err

End Sub

Private Sub EliminarViaje_Click()
    i = 3
    For i = i + 1 To Text1.Count + 1
        Select Case i - 1:
            Case 12, 13, 14:
            Text1(i - 1) = "0.00"
            band = True
        End Select
        If band = False Then
            Text1(i - 1) = ""
        Else
            band = False
        End If
    Next
    Provincia.ListIndex = 0
    FechaViaje.Mask = "##/##/####"
    FechaViaje.Text = "__/__/____"
    FechaViaje.SetFocus

End Sub


Private Sub BuscarFlet()
If OPBUSCAR = "FLETEROS" Then
    With BuscFlet
        .Show
        .Height = 6015
        .Width = 6225
        .Top = (Screen.Height - .Height) / 2
        .Left = (Screen.Width - .Width) / 2
        .Viene = "LiqProd"
    End With
End If
If OPBUSCAR = "EMPRESAS" Then
    With BuscEmpresas
        .Show
        .Height = 6015
        .Width = 6225
        .Top = (Screen.Height - .Height) / 2
        .Left = (Screen.Width - .Width) / 2
        .Viene = "LiqProd"
    End With
End If
If OPBUSCAR = "CHOFERES" Then
    With BuscChofer
        VCodflet = LiqProducto.Text1(0)
        .Show
        .Height = 6015
        .Width = 6225
        .Top = (Screen.Height - .Height) / 2
        .Left = (Screen.Width - .Width) / 2
        .Viene = "LiqProd"
    End With
End If

End Sub

Private Sub Form_KeyDown(KeyCode As Integer, Shift As Integer)
Select Case KeyCode
Case vbKeyF3: Call BuscarFlet
Case vbKeyF5: Call Aceptar_Click
End Select
End Sub
Private Sub Form_Load()
On Error Resume Next
VNroViaje = 0
        ViajesNeto = 0
        ComisNeto = 0
        IVAComis = 0
        TComis = 0
        ViajesNeto1 = 0
        IVAViajes = 0
        TViajes = 0
ListaViajes.ListItems.Clear
Set rsComprobantes = db.OpenRecordset("Select * From Comprobantes Where CodComp = 15")
VNroViaje = rsComprobantes!UltNro + 1

Set rsLiqDetViajes = Nothing
i = 0
For i = i + 1 To Text1.Count + 1
    Select Case i - 1:
        Case 12, 13, 14:
            Text1(i - 1) = "0.00"
            band = True
    End Select
    If band = False Then
        Text1(i - 1) = ""
    Else
        band = False
    End If
Next
i = 0
For i = i + 1 To Label1.Count
Select Case i
    Case 11, 13, 15, 17, 19:
        Label1(i).Caption = "0.00"
    End Select
Next
Fecha.Text = ""
Fecha.Mask = "##/##/####"
FechaViaje.Text = ""
FechaViaje.Mask = "##/##/####"

Set rsProvincias = db.OpenRecordset("Provincias")
Provincia.Clear
Do While Not rsProvincias.EOF
    Provincia.AddItem rsProvincias!DescProv
    rsProvincias.MoveNext
Loop
Provincia.ListIndex = 0
End Sub

Private Sub ListaViajes_DblClick()
Set Lista = ListaViajes.ListItems.Item(ListaViajes.SelectedItem.Index)
If Lista.SubItems(13) = "SI" Then
    MsgBox "El viaje no se puede modificar porque ya fue facturado"
Else
    Fecha = Lista.Tag
    Text1(6) = Lista.SubItems(1)
    Text1(5) = Lista.SubItems(2)
    Text1(8) = Lista.SubItems(3)
    Text1(9) = Lista.SubItems(4)
    Text1(10) = Lista.SubItems(5)
    Text1(11) = Lista.SubItems(6)
    Text1(12) = Lista.SubItems(7)
    Text1(13) = Lista.SubItems(8)
    Text1(14) = Lista.SubItems(9)
    Text1(4) = Lista.SubItems(10)
    Text1(7) = Lista.SubItems(11)
    Provincia.ListIndex = Lista.SubItems(12) - 1
    VNroViaje = Lista.SubItems(13)
    'calcula viajes
    ViajesNeto = ViajesNeto - Text1(14)
    Label1(11) = FormatNumber(ViajesNeto)
    'Calcula Comision
    ComisNeto = (ViajesNeto * Val(Text1(2))) / 100
    IVAComis = (ComisNeto * 21) / 100
    TComis = ComisNeto + IVAComis
    'calcula monto a pagar
    ViajesNeto1 = ViajesNeto - ComisNeto
    IVAViajes = (ViajesNeto1 * 21) / 100
    TViajes = ViajesNeto1 + IVAViajes
    Label1(13) = FormatNumber(ComisNeto)
    Label1(15) = FormatNumber(ViajesNeto1)
    Label1(17) = FormatNumber(IVAViajes)
    Label1(19) = FormatNumber(TViajes)
    ListaViajes.ListItems.Remove (ListaViajes.SelectedItem.Index)
End If
End Sub

Private Sub Text1_GotFocus(Index As Integer)
Dim largo As Integer
On Error Resume Next
Select Case Index
    Case 0: OPBUSCAR = "FLETEROS"
    Case 4: OPBUSCAR = "EMPRESAS"
    Case 5: 'controla empresa
        If Text1(5) = "" Then
            MsgBox "Campo requerido", vbCritical
            Text1(4).SetFocus
            Exit Sub
        End If
   
    Case 7: OPBUSCAR = "CHOFERES"
    Case 8:
        If Text1(8) = "" Then
            MsgBox "Campo requerido", vbCritical
            Text1(7).SetFocus
            Exit Sub
        End If
        
    Case 10:
        If Text1(9) = "" Then
            MsgBox "Campo requerido", vbCritical
            Text1(9).SetFocus
            Exit Sub
        End If
    Case 11:
        If Text1(10) = "" Then
            MsgBox "Campo requerido", vbCritical
            Text1(10).SetFocus
            Exit Sub
        End If
    Case 12:
        largo = Len(Text1(12))
        Text1(12).SelStart = 0
        Text1(12).SelLength = largo
    Case 13:
        largo = Len(Text1(13))
        Text1(13).SelStart = 0
        Text1(13).SelLength = largo
    
End Select
End Sub

Private Sub Text1_LostFocus(Index As Integer)
Select Case Index
    Case 0:
        If Text1(0) = "" Then
            MsgBox ("Debe completar un Fletero")
            Exit Sub
        Else
            Set rsFleteros = db.OpenRecordset("Select * From Fleteros Where CodFlet = " & Text1(0) & "")
            If Not rsFleteros.EOF And Not rsFleteros.BOF Then
                Text1(1) = rsFleteros!DescFlet
                Text1(2) = FormatNumber(rsFleteros!Comision)
                Fecha.SetFocus
            Else
                MsgBox "El Fletero no existe"
                Text1(0).SetFocus
                Exit Sub
            End If
        End If
    Case 4:
        If Text1(4) = "" Then
            MsgBox ("Debe completar una Empresa")
            Exit Sub
        Else
            Set rsEmpresas = db.OpenRecordset("Select * From Empresas Where CodEmpresas = " & Text1(4) & "")
            If Not rsEmpresas.EOF And Not rsEmpresas.BOF Then
                Text1(5) = rsEmpresas!DescEmpresas
                Text1(6).SetFocus
            Else
                MsgBox "La Empresa no existe"
                Text1(4).SetFocus
                Exit Sub
            End If
        End If
    Case 6:
        Set rsDet_LP = db.OpenRecordset("Select *  From DetViajesLP Where Remito = '" & Text1(6) & "' and CodEmpresa = " & Text1(4) & "")
            If Not rsDet_LP.EOF And Not rsDet_LP.BOF Then
                MsgBox "El Remito ya fue ingresado"
                Text1(6) = ""
            End If
    Case 7:
         If Text1(7) = "" Then
            MsgBox ("Debe completar un Chofer")
            Exit Sub
        Else
            Set rsChoferes = db.OpenRecordset("Select * From Choferes Where CodFlet = " & Text1(0) & " and CodChoferes = " & Text1(7) & "")
            If Not rsChoferes.EOF And Not rsChoferes.BOF Then
                Text1(8) = rsChoferes!AyN
                Text1(9).SetFocus
            Else
                MsgBox "El Chofer no existe"
                Text1(7).SetFocus
                Exit Sub
            End If
        End If
    Case 12:
        If Text1(12) = "" Then
            Text1(12) = "0.00"
        Else
            Text1(12) = FormatNumber(Text1(12))
            STotalViajes = (Text1(12) / 1000) * Text1(13)
            Text1(14) = FormatNumber(STotalViajes)
        End If
    Case 13:
        If Text1(13) = "" Then
            Text1(13) = "0.00"
        Else
            Text1(13) = FormatNumber(Text1(13))
            STotalViajes = (Text1(12) / 1000) * Text1(13)
            Text1(14) = FormatNumber(STotalViajes)
        End If
End Select
                
            
            
            
        
        
End Sub
